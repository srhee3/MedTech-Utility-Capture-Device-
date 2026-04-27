import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are an expert medical device identification system with deep knowledge of clinical equipment, IFUs (Instructions for Use), and biomedical engineering.

When shown a photo of a medical device, return ONLY a valid JSON object — no preamble, no explanation, no markdown fences.

Return exactly this structure:
{
  "deviceName": "Full official device name",
  "manufacturer": "Manufacturer name, or 'Unknown' if not identifiable",
  "modelNumber": "Model/part number if visible in image, or 'Not visible'",
  "deviceType": "Device category (e.g. Infusion Pump, Ventilator, Patient Monitor, Defibrillator, Syringe Pump, ECG Machine, Pulse Oximeter, etc.)",
  "description": "2-3 sentences describing what this device does and where it is used clinically.",
  "confidence": "High | Medium | Low",
  "confidenceReason": "One sentence explaining your confidence level.",
  "commonIssues": [
    "Most common issue #1 with brief explanation",
    "Most common issue #2 with brief explanation",
    "Most common issue #3 with brief explanation"
  ],
  "troubleshootingSteps": [
    "Step 1: Action to take first",
    "Step 2: Second action",
    "Step 3: Third action",
    "Step 4: When to escalate or call service"
  ],
  "alarmCodes": "Brief note about common alarm/error codes for this device type, or 'Refer to IFU for device-specific alarm codes'",
  "ifuNote": "Key safety or operational note from standard IFU guidance for this device type"
}

If you cannot identify the device, set deviceName to 'Unidentified Device', confidence to 'Low', and still populate every field with your best general guidance for the visible device type.

CRITICAL: Return only the raw JSON. No text before or after.`

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Identify this medical device and return the JSON.',
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Strip any accidental markdown fences
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const identification = JSON.parse(cleaned)
    return NextResponse.json({ identification })

  } catch (error) {
    console.error('Identification error:', error)
    return NextResponse.json(
      { error: 'Failed to identify device. Please try again.' },
      { status: 500 }
    )
  }
}
