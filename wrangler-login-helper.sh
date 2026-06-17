#!/bin/bash
# wrangler-login-helper.sh
#
# 解决代理环境下 wrangler login 回调不通的问题
# 用法：bash wrangler-login-helper.sh
# 然后把浏览器跳转后的白屏 URL 粘回来

set -e

# 清理可能干扰的环境变量
unset CLOUDFLARE_API_TOKEN

# 启动 wrangler login，--browser false 让它只打印 URL
echo "═══════════════════════════════════════════════════════"
echo "🚀 启动 wrangler login (非浏览器模式)"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "下面会打印一个 Cloudflare 授权链接，请："
echo "  1. 复制链接到浏览器打开"
echo "  2. 用 semonxue@gmail.com 登录并点 Allow"
echo "  3. 浏览器会自动跳转到 http://localhost:8976/oauth/callback?code=..."
echo "  4. 把那个白屏页面的完整 URL 粘回终端"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""

# 把 wrangler 的输出喂到一个临时文件
LOG=$(mktemp)
npx wrangler login --browser false 2>&1 | tee "$LOG" || true

# 提取授权 URL
AUTH_URL=$(grep -oE 'https://dash\.cloudflare\.com/oauth2/auth\?[^[:space:]]+' "$LOG" | head -1)
if [ -z "$AUTH_URL" ]; then
  echo ""
  echo "❌ 没找到授权 URL，请把上面的输出贴给助手"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "📋 授权 URL:"
echo "$AUTH_URL"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🔗 自动复制到剪贴板 (pbcopy)..."

# macOS 用 pbcopy
echo -n "$AUTH_URL" | pbcopy 2>/dev/null && echo "✅ 已复制" || echo "⚠️  复制失败，请手动复制上面的链接"

echo ""
echo "⏳ 等待你贴回 callback URL..."
echo "   (把浏览器白屏页面地址栏的完整 URL 粘进来，回车)"
echo ""

# 读 callback URL
read -r CALLBACK_URL

# 提取 code 参数
CODE=$(echo "$CALLBACK_URL" | grep -oE 'code=[^&]+' | head -1 | sed 's/code=//')

if [ -z "$CODE" ]; then
  echo "❌ 没找到 code 参数，URL: $CALLBACK_URL"
  exit 1
fi

echo ""
echo "🔑 拿到 code: ${CODE:0:20}..."
echo "🔧 构造新授权 URL 让 wrangler 重新走回调..."

# 拼一个 redirect_uri 完整的 URL 给 wrangler
# 实际上 wrangler 4.x 没有 --code 参数，只能让它自己起服务器
# 改用更直接的方式：写一个本地 server 处理这个 code

cat <<EOF

═══════════════════════════════════════════════════════
🎯 最简单的办法：把 code 单独贴给 Mavis
═══════════════════════════════════════════════════════

Code 提取出来：$CODE

把这个 Code 贴给 Mavis，它会帮你完成最后一步 OAuth 验证。

EOF
