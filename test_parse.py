import yaml
cases = ["draft: true", "draft: false", "draft: 'true'", "draft: 'false'", "draft: True", "draft: False"]
for c in cases:
    parsed = yaml.safe_load(c)
    val = parsed.get("draft", False)
    print(f"{c} -> val: {val} ({type(val)}), bool: {bool(val)}")
