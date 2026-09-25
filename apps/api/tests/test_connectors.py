import asyncio
import io
from datetime import datetime, timezone

import pytest
from openpyxl import Workbook

from collector.base import ConnectorDisabled, ConnectorNotConfigured, HarvestQuery
from collector.limits import DailyCap
from collector.manual import parse_csv, parse_upload
from collector.reddit import parse_listing
from collector.rss import RssConnector, parse_feed
from collector.web_public import host_allowed, robots_allowed
from collector.x_api import XConnector, parse_recent_search
from collector.youtube import YoutubeConnector, parse_comment_threads


SAMPLE_RSS = b"""<?xml version="1.0"?>
<rss version="2.0"><channel>
<item>
  <title>Agua en Saltillo</title>
  <link>https://ejemplo.mx/a</link>
  <description>El gobierno estatal anuncio cortes.</description>
  <pubDate>Mon, 01 Sep 2026 12:00:00 GMT</pubDate>
  <guid>nota-1</guid>
</item>
</channel></rss>
"""


def test_rss_extrae_titulo_y_enlace():
    items = parse_feed(SAMPLE_RSS)
    assert items[0].url == "https://ejemplo.mx/a"
    assert "Saltillo" in items[0].text
    assert items[0].published_at == datetime(2026, 9, 1, 12, tzinfo=timezone.utc)


def test_rss_apagado_no_sale_a_la_red():
    connector = RssConnector([], enabled=False)
    query = HarvestQuery(phrases=[], since=datetime.now(timezone.utc), until=datetime.now(timezone.utc))
    with pytest.raises(ConnectorDisabled):
        asyncio.run(connector.harvest(query))


def test_csv_y_sentimiento_del_analista():
    content = (
        "texto,fecha,url,autor,fuente,me_gusta,sentimiento,tema,municipio\n"
        "Sin agua en Saltillo,2026-09-01T12:00:00+00:00,https://ejemplo.mx/c,@ana,x,3,negativo,agua,Saltillo\n"
    ).encode()
    items = parse_csv(content)
    assert items[0].sentiment == "negative"
    assert items[0].theme == "agua"
    assert items[0].likes == 3


def test_xlsx_redondo():
    book = Workbook()
    sheet = book.active
    sheet.append(["texto", "fecha", "sentimiento"])
    sheet.append(["Obra nueva en Torreón", "2026-09-02T10:00:00+00:00", "positivo"])
    buffer = io.BytesIO()
    book.save(buffer)
    items = parse_upload(buffer.getvalue(), "censo.xlsx")
    assert items[0].sentiment == "positive"
    assert "Torreón" in items[0].text


def test_youtube_sin_llave():
    connector = YoutubeConnector("")
    query = HarvestQuery(phrases=["agua"], since=datetime.now(timezone.utc), until=datetime.now(timezone.utc))
    with pytest.raises(ConnectorNotConfigured):
        asyncio.run(connector.harvest(query))


def test_youtube_parsea_comentario():
    payload = {
        "items": [
            {
                "id": "t1",
                "snippet": {
                    "totalReplyCount": 2,
                    "topLevelComment": {
                        "snippet": {
                            "textOriginal": "Sigue sin agua",
                            "authorDisplayName": "Ana",
                            "likeCount": 4,
                            "publishedAt": "2026-09-01T12:00:00Z",
                            "videoId": "abc",
                        }
                    },
                },
            }
        ]
    }
    items = parse_comment_threads(payload)
    assert items[0].text == "Sigue sin agua"
    assert items[0].likes == 4


def test_reddit_y_x_parsean_sin_red():
    reddit = parse_listing({"data": {"children": [{"data": {"id": "a", "title": "Pipas", "selftext": "", "permalink": "/r/x/a", "created_utc": 1750000000, "ups": 2, "num_comments": 1, "author": "u"}}]}})
    assert reddit[0].source == "reddit"
    x_items = parse_recent_search(
        {
            "data": [{"id": "1", "text": "Corte de agua", "created_at": "2026-09-01T12:00:00Z", "author_id": "u", "public_metrics": {"like_count": 1}}],
            "includes": {"users": [{"id": "u", "username": "vecino", "public_metrics": {"followers_count": 10}}]},
        }
    )
    assert x_items[0].author_handle == "vecino"


def test_x_sin_token():
    connector = XConnector("")
    query = HarvestQuery(phrases=["agua"], since=datetime.now(timezone.utc), until=datetime.now(timezone.utc))
    with pytest.raises(ConnectorNotConfigured):
        asyncio.run(connector.harvest(query))


def test_robots_y_tope():
    robots = "User-agent: *\nDisallow: /privado\n"
    assert robots_allowed(robots, "https://medio.mx/nota", "LA-MV-Census/0.1") is True
    assert robots_allowed(robots, "https://medio.mx/privado/nota", "LA-MV-Census/0.1") is False
    assert host_allowed("https://www.medio.mx/a", ["medio.mx"]) is True
    assert host_allowed("https://otro.mx/a", ["medio.mx"]) is False
    cap = DailyCap(1)
    assert cap.allow() is True
    assert cap.allow() is False
