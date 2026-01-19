import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Delete related records first (cascade delete)
    console.log("Starting cascade deletion for user:", userId);
    
    // Delete user-related records in correct order based on actual schema
    
    // 1. Get reservation IDs first, then delete payments
    const { data: userReservations } = await supabaseAdmin
      .from("reservation")
      .select("id")
      .or(`patient_id.eq.${userId},dentist_id.eq.${userId}`);
    
    if (userReservations && userReservations.length > 0) {
      const reservationIds = userReservations.map(r => r.id);
      const { error: paymentsError } = await supabaseAdmin
        .from("payment")
        .delete()
        .in("reservation_id", reservationIds);
      
      if (paymentsError) {
        console.error("Error deleting payments:", paymentsError);
      } else {
        console.log("Successfully deleted payments");
      }
    }

    // 2. Get quotation IDs first, then delete bids
    const { data: userQuotations } = await supabaseAdmin
      .from("quotation")
      .select("id")
      .eq("patient_id", userId);
      
    if (userQuotations && userQuotations.length > 0) {
      const quotationIds = userQuotations.map(q => q.id);
      const { error: bidsError } = await supabaseAdmin
        .from("bid")
        .delete()
        .in("quotation_id", quotationIds);
        
      if (bidsError) {
        console.error("Error deleting bids:", bidsError);
      } else {
        console.log("Successfully deleted bids");
      }
    }

    // 3. Delete records with direct foreign key references
    const cascadeDeletes = [
      { table: "message", column: "sender_id" },
      { table: "reservation", column: "patient_id" },
      { table: "reservation", column: "dentist_id" },
      { table: "quotation", column: "patient_id" },
      { table: "review", column: "patient_id" },
      { table: "favorite_clinic", column: "patient_id" },
      { table: "clinic_view", column: "patient_id" },
      { table: "chat_room", column: "patient_id" },
      { table: "dentist_clinic_department", column: "dentist_id" },
    ];

    for (const { table, column } of cascadeDeletes) {
      const { error: cascadeError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(column, userId);
      
      if (cascadeError) {
        console.error(`Error deleting from ${table}:`, cascadeError);
      } else {
        console.log(`Successfully deleted records from ${table}`);
      }
    }

    // 4. Update clinic notification recipient (set to NULL instead of delete)
    const { error: clinicUpdateError } = await supabaseAdmin
      .from("clinic")
      .update({ notification_recipient_user_id: null })
      .eq("notification_recipient_user_id", userId);
      
    if (clinicUpdateError) {
      console.error("Error updating clinic notification recipient:", clinicUpdateError);
    } else {
      console.log("Successfully updated clinic notification recipient");
    }

    // 2. Delete user from database
    const { error: dbError } = await supabaseAdmin
      .from("user")
      .delete()
      .eq("id", userId);

    if (dbError) {
      console.error("Database deletion error details:", {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      });
      
      return NextResponse.json(
        { error: "Failed to delete user from database", details: dbError.message },
        { status: 500 }
      );
    }

    console.log("User record deleted successfully, now deleting from auth");

    // 3. Delete user from Supabase Auth (hard delete)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (authError) {
      console.error("Auth deletion error:", authError);
      return NextResponse.json(
        { error: "Failed to delete user from authentication" },
        { status: 500 }
      );
    }

    console.log("Account deletion completed successfully for user:", userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}