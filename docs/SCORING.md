# Scoring

El tablero no hace `positivos / total` a secas. Cada porcentaje del índice principal sale de menciones **ponderadas** que pasan los umbrales.

## Peso de una mención

```
engagement = 1 + likes + replies + shares + views/100
peso = log1p(engagement) * peso_fuente * peso_autor * recencia * relevancia * (1 - ironia)
```

La mención misma vale 1 dentro de `engagement`. Si no, un comentario sin likes valdría 0 y desaparecería.

Recencia: decaimiento exponencial, vida media 7 días.

```
recencia = 0.5 ** (edad_en_dias / vida_media)
```

Peso de autor por defecto:

- bot: 0.2
- 100,000 seguidores o más: 1.2
- 10,000 o más: 1.1
- resto: 1.0

Peso de fuente por defecto:

| Fuente en el sistema | Peso | Nombre del brief |
|---|---:|---|
| `news` | 1.4 | news_nacional |
| `manual_upload` | 1.6 | carga_oficial |
| `x` | 1.0 | x |
| `facebook` | 1.0 | — |
| `reddit` | 0.9 | reddit |
| `youtube` | 0.8 | youtube_comment |
| `web_public` | 0.7 | web_foro |

`ironía` se recorta a 0–1. Un sarcasmo alto baja el peso; no invierte solo el sentimiento. La postura (`in_favor`, `against`, `mixed`, `not_applicable`) se guarda aparte: un texto con palabras negativas puede estar a favor.

## Umbrales

- `confianza < 0.45`: no entra al índice. Cuenta en «revisión humana».
- `relevancia < 0.35`: no entra (ruido u homónimo). No va al bote de revisión por confianza.

## Índice

```
Wneu_ajustado = Wneu * 0.5
indice = 100 * (Wpos - Wneg) / (Wpos + Wneg + Wneu_ajustado)
```

Si el denominador es 0, el índice es nulo.

Los porcentajes positivo / negativo / neutro usan `Wpos`, `Wneg` y `Wneu` sin el ajuste de 0.5, y se redondean a un decimal para que sumen 100.

## Preferencia

Solo entre objetivos con `comparable=true` del mismo estudio.

```
preferencia(A, B) = indice(A) - indice(B)
intervalo = 1.96 * 100 / sqrt(nA + nB)
```

Ese intervalo es de **estabilidad del índice digital**, no un margen de error de encuesta. Si la diferencia cabe en el intervalo, el texto lo dice.

Las razones son los temas con mayor brecha de peso neto (positivo menos negativo) entre los dos objetivos.

## Sesgo conocido, visible en la UI

En política mexicana, X suele concentrar más negatividad que los medios nacionales o que una carga de censo. El índice no «corrige» ese sesgo: lo parte por fuente.

## Alcance estimado

Si hay vistas, se suman las vistas. Si no, los seguidores del autor. Es un techo burdo de exposición, no personas únicas.

## Lo que el tablero muestra junto

1. % positivo, % negativo, % neutro (ponderados)
2. Índice de favorabilidad, de −100 a +100, etiquetado también como aprobación digital
3. Volumen incluido y menciones en revisión
4. Alcance estimado
5. Share of voice (peso del objetivo entre los objetivos del estudio)
6. Preferencia A frente a B, con intervalo
7. Corte por fuente y por municipio
8. El texto: «Sentimiento digital observado. No es encuesta representativa.»
