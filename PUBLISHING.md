# 把 Sia 的个人主页公开发布

网站由两部分组成：

1. **GitHub Pages**：公开托管 HTML、CSS、JavaScript、照片和论文 PDF；
2. **Supabase**：保存不同访客共同使用的留言簿。

网站本身不收集邮箱、手机号或登录信息。留言只需要昵称和正文；新留言默认进入待确认状态，避免求职主页被广告或不合适内容刷屏。

## A. 创建共享留言簿

1. 登录 [Supabase](https://supabase.com/dashboard)，点击 **New project**。
2. 选择离主要访客较近的区域，设置数据库密码并妥善保存。
3. 项目创建完成后，打开 **SQL Editor**，点击 **New query**。
4. 复制 `deployment/supabase-guestbook.sql` 的全部内容，粘贴后点击 **Run**。
5. 打开 **Settings → API**（部分界面显示为 **Settings → API Keys**）：
   - 复制 **Project URL**；
   - 复制 **Publishable key**。旧项目也可以使用 `anon` key；
   - **绝对不要复制 Secret key 或 service_role key**。
6. 打开网站文件中的 `config.js`，只替换下面两个空字符串：

```js
window.SIA_GUESTBOOK_CONFIG = Object.freeze({
  supabaseUrl: "https://你的项目编号.supabase.co",
  supabasePublishableKey: "你的 publishable key",
  table: "guestbook_messages"
});
```

Publishable key 本来就是给浏览器使用的。安全边界来自已经写入数据库的 RLS 规则：访客只能提交待确认留言、读取已公开留言，不能修改、删除或自行公开留言。

## B. 审核与管理留言

1. 在 Supabase 打开 **Table Editor → guestbook_messages**。
2. 新留言的 `is_visible` 默认是 `false`。
3. 内容合适时，将 `is_visible` 改成 `true`；页面刷新后，它会进入公开留言簿和自动轮播。
4. 想隐藏留言时改回 `false`；想彻底移除时直接在 Table Editor 删除。

## C. 用 GitHub Pages 发布网站

1. 登录 [GitHub](https://github.com/)，右上角点击 **+ → New repository**。
2. 仓库名填写 `你的GitHub用户名.github.io`，选择 **Public**，创建仓库。
3. 在仓库页面点击 **Add file → Upload files**。
4. 将 `site-v6` 文件夹**里面的所有内容**拖入网页，包括：
   - `index.html`
   - `styles.css`
   - `script.js`
   - `config.js`
   - `assets` 文件夹
   - 其他说明文件
5. 点击 **Commit changes**。
6. 打开仓库的 **Settings → Pages**：
   - Source 选择 **Deploy from a branch**；
   - Branch 选择 `main`；
   - Folder 选择 `/(root)`；
   - 点击 **Save**。
7. 等待几分钟后，网址会是：

```text
https://你的GitHub用户名.github.io/
```

打开该网址后，用手机或无痕窗口做一次完整检查：照片、论文 PDF、留言提交、留言弹窗和移动端滚动都应正常。

## D. 第一次上线测试

1. 从公开网址提交一条测试留言。
2. 在 Supabase 的 `guestbook_messages` 表中确认它已经保存，且 `is_visible = false`。
3. 将它改为 `true`。
4. 刷新公开网页，确认它出现在留言轮播和“查看全部”弹窗中。
5. 再将测试留言删除。

## E. 后续更新网站

在本地修改完成后，将变动过的文件重新上传到同一个 GitHub 仓库并提交。GitHub Pages 通常会在数分钟内更新。留言保存在 Supabase，不会因为替换网页文件而丢失。

