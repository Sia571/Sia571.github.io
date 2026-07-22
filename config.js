/*
 * 公开留言簿配置。
 *
 * 1. 在 Supabase 创建项目并运行 deployment/supabase-guestbook.sql。
 * 2. 将下方两个空字符串替换为 Project URL 和 Publishable key。
 *
 * Publishable key 可以出现在前端；请永远不要在这里填写 Secret key
 * 或旧版 service_role key。数据安全由 Supabase RLS 策略控制。
 */
window.SIA_GUESTBOOK_CONFIG = Object.freeze({
  supabaseUrl: "https://bgkizmdlqsooaxwmgymg.supabase.co",
  supabasePublishableKey: "sb_publishable_h5mBkxVolxo2TeUAqIXQiw_LpFExCqG",
  table: "guestbook_messages"
});
