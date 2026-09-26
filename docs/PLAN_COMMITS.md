# Plan de entregas

Ocho cortes. Esta rama cubre el corte 1 y deja el tablero vivo con la semilla. Los siguientes no se simulan: cada uno exige conector, modelo o export real.

1. **Fase 0 — esqueleto usable.** Monorepo, Compose, auth, CRUD, fórmula de scoring, semilla de 2,000 menciones, login y overview. Es este cambio.
2. **Ingesta RSS en cola.** Pasar de «el parser funciona» a persistir feeds de medios MX con tope, reintento y estado por fuente.
3. **YouTube, Reddit y X oficial.** Solo con llave. Sin llave, la fuente sigue en «no configurada». Importador JSON/CSV de X ya entra en el corte 1 como carga manual.
4. **Crawler allowlist.** Robots, retraso y tope diario contra una lista del estudio, con kill switch.
5. **NLP.** `pysentimiento` para positivo/negativo/neutro y una cola aparte para postura e ironía. Cache por hash de texto. Sin modelo, la revisión humana recibe la mención.
6. **Preguntar con modelo.** `POST /ask` pasa de solape léxico a un modelo OpenAI-compatible u Ollama, citando solo menciones recuperadas.
7. **Reportes.** PDF de dos páginas con metodología y XLSX crudo. Auditoría de quién exportó.
8. **Alertas operadas.** Aviso cuando la negatividad sube 15 puntos en 24 h, más acuse en la UI. La regla ya se calcula en el overview de demostración; este corte la saca del tablero hacia un canal.

Cada corte debe poder correr con las fuentes no configuradas apagadas, sin tumbar el resto.
