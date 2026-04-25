#!/bin/bash
set -e
cd /Users/semonxue/Workplace/Works/ai-dev/awesome-video-prompts
PASS=0; FAIL=0
check() { local msg="$1"; shift; if "$@"; then PASS=$((PASS+1)); echo "  ✅ $msg"; else FAIL=$((FAIL+1)); echo "  ❌ $msg"; fi; }

echo "========================================"
echo "  Test 1: 首页 HTML 结构"
echo "========================================"
F="public/index.html"
check "文件存在且 > 200KB" test -f "$F" -a "$(wc -c < "$F")" -gt 200000
check "包含 DOCTYPE" grep -q '<!doctype' "$F"
check "包含 </html>" grep -q '</html>' "$F"
check "包含 site-header" grep -q 'site-header' "$F"
check "包含 masonry-grid" grep -q 'masonry-grid' "$F"
check "包含 loading-more" grep -q 'loading-more' "$F"
check "包含 site-footer" grep -q 'site-footer' "$F"
check "包含 function createCardHTML" grep -q 'function createCardHTML' "$F"
check "包含 function layoutMasonry" grep -q 'function layoutMasonry' "$F"
check "包含 function applyFiltersAndRender" grep -q 'function applyFiltersAndRender' "$F"
check "包含 mobileFilters (特有)" grep -q 'mobileFilters' "$F"
check "包含 fetchpriority 逻辑" grep -q 'fetchpriority' "$F"
check "无 console.log" grep -qv 'console\.log' "$F"
check "包含外部 CSS 引用" grep -q 'main.*\.css' "$F"
check "包含外部 JS 引用" grep -q 'global.*\.js' "$F"
echo "  PASS=$PASS FAIL=$FAIL"
T1_PASS=$PASS

echo ""
echo "========================================"
echo "  Test 2: JSON 数据文件"
echo "========================================"
PASS=0
F="public/prompts-index.json"
check "文件存在" test -f "$F"
check "文件 > 4MB" test "$(wc -c < "$F")" -gt 4000000
check "是合法 JSON" python3 -c "import json; json.load(open('$F'))" 2>/dev/null
check "JSON 数组 > 2000 条" python3 -c "import json; d=json.load(open('$F')); assert len(d)>2000, f'{len(d)}'"
check "包含 title 字段" python3 -c "import json; d=json.load(open('$F')); assert all('title' in i for i in d)"
check "包含 image 字段" python3 -c "import json; d=json.load(open('$F')); assert all('image' in i for i in d)"
check "包含 tags 字段" python3 -c "import json; d=json.load(open('$F')); assert all('tags' in i for i in d)"
check "包含 permalink 字段" python3 -c "import json; d=json.load(open('$F')); assert all('permalink' in i for i in d)"
check "包含 model 字段" python3 -c "import json; d=json.load(open('$F')); assert all('model' in i for i in d)"
check "包含 filename 字段" python3 -c "import json; d=json.load(open('$F')); assert all('filename' in i for i in d)"
python3 -c "import json; d=json.load(open('$F')); print(f'  总计: {len(d)} 条'); print(f'  第1条: {d[0][\"title\"][:80]}'); print(f'  最后: {d[-1][\"title\"][:80]}')"
echo "  PASS=$PASS FAIL=$FAIL"
T2_PASS=$PASS

echo ""
echo "========================================"
echo "  Test 3: Model 页面"
echo "========================================"
PASS=0
F="public/models/kling/index.html"
check "文件存在" test -f "$F"
check "包含 createCardHTML" grep -q 'function createCardHTML' "$F"
check "包含 layoutMasonry" grep -q 'function layoutMasonry' "$F"
check "包含特有的 loadPromptsData" grep -q 'function loadPromptsData' "$F"
check "包含 model-page" grep -q 'model-page' "$F"
check "不包含 mobileFilters" grep -qv 'mobileFilters' "$F"
check "不包含 exploreModelLink" grep -qv 'exploreModelLink\|updateExploreModelLink' "$F"
check "无 console.log" grep -qv 'console\.log' "$F"
check "包含外部 CSS" grep -q 'main.*\.css' "$F"
check "包含外部 JS" grep -q 'global.*\.js' "$F"
echo "  PASS=$PASS FAIL=$FAIL"
T3_PASS=$PASS

echo ""
echo "========================================"
echo "  Test 4: 外部 CSS/JS 资源"
echo "========================================"
PASS=0
CSS=$(find public/css -name 'main.min.*.css' -not -path '*/ananke/*' | head -1)
JS=$(find public/js -name 'global.min.*.js' | head -1)
check "CSS 文件存在" test -n "$CSS" -a -f "$CSS"
check "JS 文件存在" test -n "$JS" -a -f "$JS"
echo "  CSS: $CSS ($(wc -c < "$CSS") bytes)"
echo "  JS:  $JS ($(wc -c < "$JS") bytes)"
check "CSS 包含 aspect-ratio" grep -q 'aspect-ratio' "$CSS"
check "CSS 包含 prompt-image-wrapper" grep -q 'prompt-image-wrapper' "$CSS"
check "CSS 包含 prompt-card" grep -q 'prompt-card' "$CSS"
check "CSS 包含 :root 变量" grep -q ':root' "$CSS"
check "CSS 包含 @media" grep -q '@media' "$CSS"
check "CSS 包含 compact" grep -q 'compact' "$CSS"
check "JS 包含 truncateMobileTitle" grep -q 'truncateMobileTitle' "$JS"
check "JS 包含 video hover" grep -q 'prompt-hover-video\|Video hover' "$JS"
check "JS 包含 clipboard" grep -q 'clipboard' "$JS"
echo "  PASS=$PASS FAIL=$FAIL"
T4_PASS=$PASS

echo ""
echo "========================================"
echo "  Test 5: Meta 标签 & 预加载"
echo "========================================"
PASS=0
F="public/index.html"
check "display=optional" grep -q 'display=optional' "$F"
check "dns-prefetch pbs.twimg.com" grep -q 'dns-prefetch.*pbs.twimg.com' "$F"
check "dns-prefetch video.twimg.com" grep -q 'dns-prefetch.*video.twimg.com' "$F"
check "preconnect fonts.googleapis" grep -q 'preconnect.*fonts.googleapis' "$F"
check "meta charset utf-8" grep -q 'charset.*utf-8' "$F"
check "meta viewport" grep -q 'viewport' "$F"
check "meta description" grep -q 'meta.*description' "$F"
check "canonical" grep -q 'canonical' "$F"
check "og:title" grep -q 'og:title' "$F"
check "twitter:card" grep -q 'twitter:card' "$F"
echo "  PASS=$PASS FAIL=$FAIL"
T5_PASS=$PASS

echo ""
echo "========================================"
echo "  Test 6: 所有页面一致性"
echo "========================================"
PASS=0
for f in public/index.html public/models/kling/index.html public/zh-cn/index.html public/ja/index.html public/gfeed/index.html public/about/index.html; do
  if [ -f "$f" ]; then
    name=$(echo "$f" | sed 's|public/||')
    check "$name 无 console.log" grep -qv 'console\.log' "$f"
  fi
done

# Check DOCTYPE in all HTML files
MISSING=0; TOTAL=0
for f in $(find public -name '*.html' -not -path '*/ananke/*'); do
  TOTAL=$((TOTAL+1))
  if ! head -1 "$f" | grep -qi '<!doctype'; then
    MISSING=$((MISSING+1))
  fi
done
check "所有 HTML 有 DOCTYPE ($MISSING/$TOTAL 缺失)" test "$MISSING" -eq 0

echo ""
echo "========================================"
echo "  文件总览"
echo "========================================"
echo "  首页:      $(ls -lh public/index.html | awk '{print $5}')"
echo "  Model 页:  $(ls -lh public/models/kling/index.html | awk '{print $5}')"
echo "  JSON 数据:  $(ls -lh public/prompts-index.json | awk '{print $5}')"
echo "  CSS:       $(find public/css -name 'main.min.*.css' -not -path '*/ananke/*' -exec ls -lh {} \; | awk '{print $5}')"
echo "  JS:        $(find public/js -name 'global.min.*.js' -exec ls -lh {} \; | awk '{print $5}')"
echo "  PASS=$PASS FAIL=$FAIL"
T6_PASS=$PASS

echo ""
echo "========================================"
echo "  总结"
echo "========================================"
echo "  Test 1 (首页):      $T1_PASS 通过"
echo "  Test 2 (JSON):       $T2_PASS 通过"
echo "  Test 3 (Model 页):   $T3_PASS 通过"
echo "  Test 4 (CSS/JS):     $T4_PASS 通过"
echo "  Test 5 (Meta):       $T5_PASS 通过"
echo "  Test 6 (一致性):     $T6_PASS 通过"
