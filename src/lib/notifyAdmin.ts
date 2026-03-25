import { supabase } from "@/integrations/supabase/client";

/**
 * Sends an automatic message to the admin when an employer accepts a candidate.
 * Creates or reuses a conversation between the current user and the admin.
 */
export async function notifyAdminOnAccepted({
  senderId,
  candidateName,
  jobTitle,
}: {
  senderId: string;
  candidateName: string;
  jobTitle: string;
}) {
  // Find admin user
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("role", "admin" as any)
    .limit(1)
    .maybeSingle();

  if (!adminProfile) return;

  const adminId = adminProfile.user_id;
  if (adminId === senderId) return; // Admin changed the status themselves, no need to notify

  // Find or create conversation with admin
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(participant_one.eq.${senderId},participant_two.eq.${adminId}),and(participant_one.eq.${adminId},participant_two.eq.${senderId})`
    )
    .maybeSingle();

  let conversationId: string;

  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({ participant_one: senderId, participant_two: adminId })
      .select("id")
      .single();
    if (!newConv) return;
    conversationId = newConv.id;
  }

  // Send notification message
  const message = `📋 Notification automatique : La candidature de "${candidateName}" pour le poste "${jobTitle}" a été acceptée. Veuillez contacter le candidat.`;

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content: message,
  });

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}
