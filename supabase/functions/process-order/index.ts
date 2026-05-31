import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from("restaurants")
      .select("owner_id")
      .eq("id", order.restaurant_id)
      .single();

    if (restaurantError || !restaurant) {
      return new Response(
        JSON.stringify({ error: "Restaurant not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const commissionRate = 0.15;
    const restaurantEarnings = order.subtotal * (1 - commissionRate);

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("balance")
      .eq("user_id", restaurant.owner_id)
      .single();

    if (!profileError && profile) {
      const newBalance = profile.balance + restaurantEarnings;
      await supabaseClient
        .from("profiles")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", restaurant.owner_id);
    }

    const deliveryEarnings = order.delivery_fee * 0.8;

    const { data: delivery, error: deliveryError } = await supabaseClient
      .from("deliveries")
      .select("driver_id")
      .eq("order_id", orderId)
      .single();

    if (!deliveryError && delivery?.driver_id) {
      const { data: driverProfile, error: driverProfileError } = await supabaseClient
        .from("profiles")
        .select("balance")
        .eq("user_id", delivery.driver_id)
        .single();

      if (!driverProfileError && driverProfile) {
        const newDriverBalance = driverProfile.balance + deliveryEarnings;
        await supabaseClient
          .from("profiles")
          .update({ balance: newDriverBalance, updated_at: new Date().toISOString() })
          .eq("user_id", delivery.driver_id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        restaurantEarnings,
        deliveryEarnings: delivery?.driver_id ? deliveryEarnings : 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing order:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
