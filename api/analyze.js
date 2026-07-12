export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { images, direction } = req.body;
  if (!images || images.length === 0) return res.status(400).json({ error: 'No images provided' });

  const directionText = direction === 'long' ? 'LARGO (compra)' : 'CORTO (venta)';

  const content = [
    {
      type: 'text',
      text: `Eres el asistente de análisis técnico de CriptoRadar. El trader busca una operación en ${directionText}.

Analiza todas las imágenes enviadas e identifica los indicadores visibles. Aplica esta metodología:

COLORES DE INDICADORES:
- SMA 20 = naranja (banda media Bollinger)
- SMA 50 = azul
- SMA 100 = morada  
- SMA 200 = roja
- Imbalances/bloques de órdenes = rectángulos cyan

KONCORDE:
- Azul positivo + verde negativo = acumulación institucional (favorable largo, bandera roja corto)
- Azul negativo + verde positivo = distribución institucional (favorable corto, bandera roja largo)
- Señal válida solo si hay montaña en ambos lados del punto cero simultáneamente

BANDAS DE BOLLINGER:
- Banda superior ascendente = favorable largo / descendente = bandera roja largo
- SMA 20 por encima del precio = bandera roja largo / por debajo = bandera roja corto
- Banda inferior descendente = favorable corto / ascendente = bandera roja corto

MEDIAS MÓVILES:
- SMA 200 por debajo precio = tendencia alcista / por encima = tendencia bajista
- Cualquier media entre entrada y profit = bandera roja
- No operar contra cruces de medias
- Cruce ascendente = bandera roja máxima para cortos
- Cruce descendente = bandera roja máxima para largos

MACD (azul y naranja):
- Divergencia bajista = bandera roja para largos
- Divergencia alcista = bandera roja para cortos
- Azul cruza naranja en zona negativa hacia arriba = oportunidad largo, bandera roja máxima corto
- Azul cruza naranja en zona positiva hacia abajo = bandera roja máxima largo

RSI:
- Mismas reglas de divergencia que MACD
- Por encima 70 = advertencia sobrecompra / por debajo 30 = advertencia sobreventa
- Puede mantenerse en zona extrema — valorar estructura del mercado

ADX y AO:
- AO cruza negativo a positivo + ADX gira al alza 100 grados = señal largo
- AO cruza positivo a negativo + ADX gira al alza 100 grados = señal corto
- En semanal = señal de largo/medio plazo

FIBONACCI:
- 61.8% = bandera roja más importante, diario es obligatorio
- Profit siempre antes del 61.8% si está en el camino
- Busca confluencias entre niveles y otros indicadores

IMBALANCES (rectángulos cyan):
- Por encima del precio en largo = bandera roja, profit no debe superarlo
- Por debajo del precio en corto = bandera roja
- Solo válidos si la rotura fue con vela de cuerpo, no con mecha

LIQUIDACIONES (heatmap):
- Zonas amarillas = máxima concentración, mayor imán
- En largo = orden límite en zona amarilla inferior más cercana
- Stop nunca por encima de zonas de liquidación importantes inferiores en largo

STOP LOSS:
- En largo: stop por debajo de imbalances, medias, Fibonacci, liquidaciones. Nunca por encima de ellos
- En corto: stop por encima de imbalances, medias, Fibonacci, liquidaciones. Nunca por debajo de ellos

ESTRUCTURA DE MERCADO:
- Rotura de máximo con cuerpo = estructura alcista válida
- Rotura con mecha y cierre por debajo = trampa, señal bajista

REGLA FUNDAMENTAL: La temporalidad mayor tiene más peso. El profit debe situarse antes de la primera bandera roja relevante. Una bandera roja no impide operar si el recorrido libre es suficiente.

Responde SIEMPRE con este formato exacto:

ANÁLISIS CRIPTO-RADAR
Dirección buscada: ${directionText}

TEMPORALIDADES ANALIZADAS:
[Para cada imagen, indica la temporalidad si es visible y el análisis]

INDICADORES NO VISIBLES — REVISAR ANTES DE OPERAR:
[Lista los indicadores que no aparecen en ninguna imagen]

BANDERAS ROJAS IDENTIFICADAS:
[Lista cada bandera roja con el nivel de precio si es visible]

RECORRIDO LIBRE HASTA:
[Indica el nivel hasta donde el camino está despejado]

PROFIT SUGERIDO:
[Nivel sugerido]

STOP SUGERIDO:
[Nivel sugerido]

VEREDICTO:
[FAVORABLE / PRECAUCIÓN / NO OPERAR] — [explicación breve]`
    },
    ...images.map(img => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.data.split(';')[0].split(':')[1],
        data: img.data.split(',')[1]
      }
    }))
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content }]
    })
  });

  const data = await response.json();
  const analysis = data.content?.[0]?.text || 'Error al obtener el análisis';
  res.status(200).json({ analysis });
}
