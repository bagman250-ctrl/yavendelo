import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

import { getBoostPlan } from "@/lib/boostPlans";

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;

  const maybeMercadoPagoError = error as {
    message?: string;
    cause?: Array<{
      description?: string;
    }>;
  };

  return (
    maybeMercadoPagoError.message ||
    maybeMercadoPagoError.cause?.[0]?.description ||
    "No se pudo crear la preferencia"
  );
}

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Falta MERCADOPAGO_ACCESS_TOKEN en .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const postId = String(body?.postId || "").trim();
    const title = String(body?.title || "Producto YaVendelo").trim();
    const plan = String(body?.plan || "").trim();
    const planConfig = getBoostPlan(plan);

    if (!postId || !title || !planConfig) {
      return NextResponse.json(
        { error: "Faltan datos para crear el pago" },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://yavendeloapp.com";

    const client = new MercadoPagoConfig({
      accessToken,
    });

    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: [
          {
            id: postId,
            title: `Boost YaVendelo - ${title.slice(0, 80)}`,
            quantity: 1,
            unit_price: planConfig.price,
            currency_id: "MXN",
          },
        ],

        metadata: {
          postId,
          plan: planConfig.id,
        },

        external_reference: `${postId}__${planConfig.id}`,

        notification_url: `${appUrl}/api/mercadopago/webhook`,

        back_urls: {
          success: `${appUrl}/perfil?payment=success`,
          failure: `${appUrl}/perfil?payment=failure`,
          pending: `${appUrl}/perfil?payment=pending`,
        },
      },
    });

    return NextResponse.json({
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
    });
  } catch (error) {
    console.error("MERCADO PAGO ERROR:", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
