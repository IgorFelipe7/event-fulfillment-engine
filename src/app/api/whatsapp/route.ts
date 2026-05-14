import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { phone, message } = await req.json();

        const instanceId = process.env.ZAPI_INSTANCE_ID;
        const instanceToken = process.env.ZAPI_INSTANCE_TOKEN;
        const clientToken = process.env.ZAPI_CLIENT_TOKEN;

        if (!instanceId || !instanceToken || !clientToken) {
            return NextResponse.json({ error: 'Credenciais da Z-API ausentes no servidor.' }, { status: 500 });
        }

        let formattedPhone = phone.replace(/\D/g, '');
        if (!formattedPhone.startsWith('55')) {
            formattedPhone = `55${formattedPhone}`;
        }

        const url = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Client-Token': clientToken,
            },
            body: JSON.stringify({
                phone: formattedPhone,
                message: message,
            }),
        });

        const data = await response.json();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ error: 'Falha ao conectar com a Z-API.' }, { status: 500 });
    }
}