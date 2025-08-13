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
    
    // Delete user-related records in order (to handle foreign key constraints)
    const cascadeDeletes = [
      // Delete chat room messages first
      { table: "message", column: "sender_id" },
      
      // Delete chat rooms where user is patient
      { table: "chat_room", column: "patient_id" },
      
      // Delete reviews
      { table: "review", column: "patient_id" },
      
      // Delete reservations (both as patient and dentist)
      { table: "reservation", column: "patient_id" },
      { table: "reservation", column: "dentist_id" },
      
      // Delete quotations
      { table: "quotation", column: "patient_id" },
      
      // Delete favorite clinics
      { table: "favorite_clinic", column: "patient_id" },
      
      // Delete clinic views
      { table: "clinic_view", column: "patient_id" },
      
      // Delete dentist department associations
      { table: "dentist_clinic_department", column: "dentist_id" },
      
      // Delete clinic notifications recipient
      { table: "clinic_notification", column: "notification_recipient_user_id" },
    ];

    for (const { table, column } of cascadeDeletes) {
      const { error: cascadeError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(column, userId);
      
      if (cascadeError) {
        console.error(`Error deleting from ${table}:`, cascadeError);
        // Continue with other deletions even if some fail
      } else {
        console.log(`Successfully deleted records from ${table}`);
      }
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