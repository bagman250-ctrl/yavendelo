import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { getBoostDays, getBoostPlan } from "@/lib/boostPlans";

type WebhookBody = {
  type?: string;
  topic?: string;
  action?: string;
  id?: string | number;
  data?: {
    id?: string | number;
  };
};

type MerchantOrder = {
  external_reference?: string;
  payments?: Array<{
    id?: string | number;
    status?: string;
  }>;
};

function initAdmin() {
  if (getApps().length) return;

  const serviceAccountBase64 =
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64;

  if (!serviceAccountBase64) {
    throw new Error("Falta FIREBASE_ADMIN_SERVICE_ACCOUNT_BASE64");
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, "base64").toString("utf8")
  );

  initializeApp({
    credential: cert(serviceAccount),
  });
}

async function activateBoost(postId: string, plan: string, paymentId: string) {
  const adminDb = getFirestore();
  const days = getBoostDays(plan);

  await adminDb.collection("posts").doc(postId).update({
    featured: true,
    featuredUntil: Date.now() + days * 24 * 60 * 60 * 1000,
    boostPlan: plan,
    boostPaid: true,
    boostedAt: Date.now(),
    mercadoPagoPaymentId: paymentId,
  });
}

async function getMerchantOrder(orderId: string, accessToken: string) {
  const response = await fetch(
    `https://api.mercadopago.com/merchant_orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("MERCHANT ORDER FETCH ERROR:", response.status, text);
    return null;
  }

  return (await response.json()) as MerchantOrder;
}

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Falta MERCADOPAGO_ACCESS_TOKEN" },
        { status: 500 }
      );
    }

    initAdmin();

    const url = new URL(request.url);
    const queryType = url.searchParams.get("type") || "";
    const queryId = url.searchParams.get("data.id") || "";

    let body: WebhookBody = {};

    try {
      body = await request.json();
    } catch {}

    const eventType =
      body?.type ||
      body?.topic ||
      body?.action ||
      queryType ||
      "";

    const eventId =
      body?.data?.id ||
      body?.id ||
      queryId ||
      "";

    console.info("WEBHOOK EVENT:", {
      eventType,
      eventId,
    });

    if (!eventId) {
      return NextResponse.json({ received: true });
    }

    const client = new MercadoPagoConfig({
      accessToken,
    });

    if (String(eventType).includes("merchant_order")) {
      const merchantOrder = await getMerchantOrder(
        String(eventId),
        accessToken
      );

      if (!merchantOrder) {
        return NextResponse.json({
          received: true,
          warning: "merchant_order_not_found",
          eventId,
        });
      }

      const approvedPayment = merchantOrder.payments?.find(
        (payment) => payment.status === "approved"
      );

      if (!approvedPayment) {
        return NextResponse.json({
          received: true,
          warning: "merchant_order_without_approved_payment",
        });
      }

      const externalReference = merchantOrder.external_reference || "";
      const [postId, plan] = externalReference.split("__");
      const planConfig = getBoostPlan(plan || "7days");

      if (!postId || !planConfig) {
        return NextResponse.json({
          received: true,
          warning: "merchant_order_without_valid_external_reference",
        });
      }

      await activateBoost(
        String(postId),
        planConfig.id,
        String(approvedPayment.id)
      );

      return NextResponse.json({
        success: true,
        source: "merchant_order",
        postId,
        plan,
      });
    }

    if (String(eventType).includes("payment")) {
      const paymentClient = new Payment(client);

      const payment = await paymentClient.get({
        id: String(eventId),
      });

      if (payment.status !== "approved") {
        return NextResponse.json({
          received: true,
          status: payment.status,
        });
      }

      const metadata = (payment.metadata || {}) as Record<string, unknown>;
      const postId = metadata.postId || metadata.post_id;
      const plan = metadata.plan || "7days";
      const planConfig = getBoostPlan(String(plan));

      if (!postId || !planConfig) {
        return NextResponse.json({
          received: true,
          warning: "payment_without_valid_metadata",
        });
      }

      await activateBoost(String(postId), planConfig.id, String(eventId));

      return NextResponse.json({
        success: true,
        source: "payment",
        postId,
        plan,
      });
    }

    return NextResponse.json({
      received: true,
      ignored: eventType,
    });
  } catch (error) {
    console.error("MERCADO PAGO WEBHOOK ERROR:", error);

    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}
