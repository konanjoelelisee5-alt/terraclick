/* @ds-bundle: {"format":4,"namespace":"ServisYakroDesignSystem_b6c27b","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"CategoryTile","sourcePath":"components/marketplace/CategoryTile.jsx"},{"name":"ProviderCard","sourcePath":"components/marketplace/ProviderCard.jsx"},{"name":"Rating","sourcePath":"components/marketplace/Rating.jsx"},{"name":"SearchBar","sourcePath":"components/marketplace/SearchBar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"e57bc0a45fd5","components/core/Badge.jsx":"41ca5838d70f","components/core/Button.jsx":"4b4c8b34619d","components/core/Card.jsx":"c0e58bd44e9f","components/core/IconButton.jsx":"2ed9d136ba09","components/core/Tag.jsx":"8f2f1866473f","components/feedback/Dialog.jsx":"959e2ae9e41c","components/feedback/Toast.jsx":"65ada408d944","components/feedback/Tooltip.jsx":"d6a300100cb8","components/forms/Checkbox.jsx":"55828314096f","components/forms/Input.jsx":"8c8e23c4d083","components/forms/Radio.jsx":"4792a01d7b92","components/forms/Select.jsx":"9ff298d8cd7a","components/forms/Switch.jsx":"05c288915700","components/forms/Textarea.jsx":"d92d2e2b048f","components/marketplace/CategoryTile.jsx":"016b299496c1","components/marketplace/ProviderCard.jsx":"fe48165c4188","components/marketplace/Rating.jsx":"ee4e188d5355","components/marketplace/SearchBar.jsx":"57c6e1093133","components/navigation/Tabs.jsx":"a2a68ad9c737","ui_kits/android/Screens.jsx":"c637b7b107f5","ui_kits/android/Shell.jsx":"f6d22b021a8b","ui_kits/android/app-root.jsx":"e775ac7ad634","ui_kits/web/Chrome.jsx":"d3697acb5263","ui_kits/web/HomeScreen.jsx":"d74c902efbd8","ui_kits/web/ProviderScreen.jsx":"41949040f155","ui_kits/web/RequestScreen.jsx":"f99a82a9c1a8","ui_kits/web/ResultsScreen.jsx":"96cee96b852b","ui_kits/web/app-root.jsx":"3daf2e08ceb7","ui_kits/web/data.jsx":"6d5c15eda0c4"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ServisYakroDesignSystem_b6c27b = window.ServisYakroDesignSystem_b6c27b || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Avatar({
  src,
  name = "",
  size = "md",
  verified = false,
  className = "",
  ...rest
}) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["sy-avatar", `sy-avatar--${size}`, className].filter(Boolean).join(" "),
    style: src ? {
      backgroundImage: `url(${src})`
    } : undefined,
    title: name
  }, rest), !src && initials, verified && /*#__PURE__*/React.createElement("span", {
    className: "sy-avatar__verified"
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Badge({
  tone = "neutral",
  dot = false,
  className = "",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["sy-badge", `sy-badge--${tone}`, className].filter(Boolean).join(" ")
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "sy-badge__dot"
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Button({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  iconLeft,
  iconRight,
  as = "button",
  className = "",
  children,
  ...rest
}) {
  const Tag = as;
  const cls = ["sy-btn", `sy-btn--${variant}`, `sy-btn--${size}`, block ? "sy-btn--block" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls
  }, rest), loading ? /*#__PURE__*/React.createElement("span", {
    className: "sy-btn__spinner",
    "aria-hidden": "true"
  }) : iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  elevation = "sm",
  interactive = false,
  padded = false,
  className = "",
  children,
  ...rest
}) {
  const cls = ["sy-card", elevation === "none" ? "sy-card--flat" : elevation === "md" ? "sy-card--raised" : "", interactive ? "sy-card--interactive" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), padded ? /*#__PURE__*/React.createElement("div", {
    className: "sy-card__body"
  }, children) : children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  variant = "plain",
  size = "md",
  label,
  className = "",
  children,
  ...rest
}) {
  const cls = ["sy-iconbtn", `sy-iconbtn--${variant}`, `sy-iconbtn--${size}`, className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    "aria-label": label,
    title: label
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tag({
  selected = false,
  onRemove,
  className = "",
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: ["sy-tag", selected ? "sy-tag--selected" : "", className].filter(Boolean).join(" ")
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("span", {
    className: "sy-tag__remove",
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 2.5l7 7M9.5 2.5l-7 7",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }))));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open = true,
  title,
  description,
  icon,
  onClose,
  footer,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "sy-dialog__scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "sy-dialog",
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "sy-dialog__head"
  }, icon, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sy-dialog__title"
  }, title), description && /*#__PURE__*/React.createElement("div", {
    className: "sy-dialog__desc"
  }, description))), children && /*#__PURE__*/React.createElement("div", {
    className: "sy-dialog__body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "sy-dialog__foot"
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const glyphs = {
  success: "M3 8.5l3.2 3.2L13 5",
  danger: "M8 4v5M8 11.5v.5",
  info: "M8 7v5M8 4.5v.5"
};
function Toast({
  tone = "success",
  title,
  description,
  action,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ["sy-toast", `sy-toast--${tone}`, className].filter(Boolean).join(" "),
    role: "status"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sy-toast__icon"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none"
  }, tone !== "success" && /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "8",
    r: "6.6",
    stroke: "currentColor",
    strokeWidth: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: glyphs[tone],
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sy-toast__title"
  }, title), description && /*#__PURE__*/React.createElement("div", {
    className: "sy-toast__desc"
  }, description)), action);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  content,
  children,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: ["sy-tooltip", className].filter(Boolean).join(" ")
  }, children, /*#__PURE__*/React.createElement("span", {
    className: "sy-tooltip__bubble",
    role: "tooltip"
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  disabled = false,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: ["sy-choice", disabled ? "sy-choice--disabled" : "", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sy-choice__box sy-choice__box--check"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 6.3l2.4 2.4 4.6-5",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  hint,
  error,
  icon,
  id,
  className = "",
  ...rest
}) {
  const fid = id || `sy-${Math.random().toString(36).slice(2, 8)}`;
  const field = /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    className: ["sy-input", error ? "sy-input--invalid" : "", className].filter(Boolean).join(" ")
  }, rest));
  return /*#__PURE__*/React.createElement("div", {
    className: "sy-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "sy-field__label",
    htmlFor: fid
  }, label), icon ? /*#__PURE__*/React.createElement("div", {
    className: "sy-input-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sy-input-wrap__icon"
  }, icon), field) : field, error ? /*#__PURE__*/React.createElement("span", {
    className: "sy-field__error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "sy-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Radio({
  label,
  disabled = false,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: ["sy-choice", disabled ? "sy-choice--disabled" : "", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sy-choice__box sy-choice__box--radio"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sy-choice__dot"
  })), label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  hint,
  error,
  options = [],
  id,
  className = "",
  children,
  ...rest
}) {
  const fid = id || `sy-${Math.random().toString(36).slice(2, 8)}`;
  return /*#__PURE__*/React.createElement("div", {
    className: "sy-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "sy-field__label",
    htmlFor: fid
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "sy-select-wrap"
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: fid,
    className: ["sy-select", error ? "sy-select--invalid" : "", className].filter(Boolean).join(" ")
  }, rest), children || options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value ?? o,
    value: o.value ?? o
  }, o.label ?? o))), /*#__PURE__*/React.createElement("span", {
    className: "sy-select-wrap__caret"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3.5 5.5L7 9l3.5-3.5",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })))), error ? /*#__PURE__*/React.createElement("span", {
    className: "sy-field__error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "sy-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  label,
  disabled = false,
  className = "",
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: ["sy-choice", disabled ? "sy-choice--disabled" : "", className].filter(Boolean).join(" "),
    style: {
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      gap: 16
    }
  }, label && /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    disabled: disabled
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "sy-switch"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sy-switch__knob"
  })));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
  label,
  hint,
  error,
  id,
  className = "",
  ...rest
}) {
  const fid = id || `sy-${Math.random().toString(36).slice(2, 8)}`;
  return /*#__PURE__*/React.createElement("div", {
    className: "sy-field"
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "sy-field__label",
    htmlFor: fid
  }, label), /*#__PURE__*/React.createElement("textarea", _extends({
    id: fid,
    className: ["sy-textarea", error ? "sy-input--invalid" : "", className].filter(Boolean).join(" ")
  }, rest)), error ? /*#__PURE__*/React.createElement("span", {
    className: "sy-field__error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "sy-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/marketplace/CategoryTile.jsx
try { (() => {
function CategoryTile({
  label,
  count,
  icon,
  onClick,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: ["sy-cat", className].filter(Boolean).join(" "),
    onClick: onClick
  }, /*#__PURE__*/React.createElement("span", {
    className: "sy-cat__icon"
  }, icon), /*#__PURE__*/React.createElement("span", {
    className: "sy-cat__label"
  }, label), count != null && /*#__PURE__*/React.createElement("span", {
    className: "sy-cat__count"
  }, count, " prestataires"));
}
Object.assign(__ds_scope, { CategoryTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketplace/CategoryTile.jsx", error: String((e && e.message) || e) }); }

// components/marketplace/Rating.jsx
try { (() => {
function Rating({
  value = 0,
  count,
  size = 14,
  showValue = true,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: ["sy-rating", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("span", {
    className: "sy-rating__stars"
  }, [0, 1, 2, 3, 4].map(i => /*#__PURE__*/React.createElement("svg", {
    key: i,
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: i < Math.round(value) ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: "1.3"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.2L8 11.6 4.2 13.5l.7-4.2-3.1-3 4.3-.6z",
    strokeLinejoin: "round"
  })))), showValue && /*#__PURE__*/React.createElement("strong", {
    style: {
      fontWeight: 700
    }
  }, Number(value).toFixed(1)), count != null && /*#__PURE__*/React.createElement("span", {
    className: "sy-rating__count"
  }, "(", count, ")"));
}
Object.assign(__ds_scope, { Rating });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketplace/Rating.jsx", error: String((e && e.message) || e) }); }

// components/marketplace/ProviderCard.jsx
try { (() => {
function ProviderCard({
  name,
  trade,
  commune,
  rating = 0,
  reviews,
  price,
  avatar,
  verified = false,
  available,
  action = "Contacter",
  onAction,
  onClick,
  className = ""
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    interactive: !!onClick,
    onClick: onClick,
    className: className
  }, /*#__PURE__*/React.createElement("div", {
    className: "sy-provider"
  }, /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    name: name,
    src: avatar,
    size: "lg",
    verified: verified
  }), /*#__PURE__*/React.createElement("div", {
    className: "sy-provider__meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sy-provider__name"
  }, name, verified && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "success"
  }, "V\xE9rifi\xE9")), /*#__PURE__*/React.createElement("div", {
    className: "sy-provider__trade"
  }, trade, commune ? " · " + commune : ""), /*#__PURE__*/React.createElement("div", {
    className: "sy-provider__row"
  }, /*#__PURE__*/React.createElement(__ds_scope.Rating, {
    value: rating,
    count: reviews
  }), available && /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: "brand",
    dot: true
  }, available)))), /*#__PURE__*/React.createElement("div", {
    className: "sy-provider__foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sy-provider__price"
  }, price), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    size: "sm",
    variant: "outline",
    onClick: e => {
      e.stopPropagation();
      onAction && onAction(e);
    }
  }, action)));
}
Object.assign(__ds_scope, { ProviderCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketplace/ProviderCard.jsx", error: String((e && e.message) || e) }); }

// components/marketplace/SearchBar.jsx
try { (() => {
function SearchBar({
  queryPlaceholder = "Quel service cherchez-vous ?",
  placePlaceholder = "Commune",
  action = "Rechercher",
  onSubmit,
  compact = false,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("form", {
    className: ["sy-search", className].filter(Boolean).join(" "),
    onSubmit: e => {
      e.preventDefault();
      onSubmit && onSubmit(e);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "sy-search__seg"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 20 20",
    fill: "none",
    style: {
      color: "var(--text-muted)",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "9",
    r: "6.2",
    stroke: "currentColor",
    strokeWidth: "1.7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13.6 13.6L17.5 17.5",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round"
  })), /*#__PURE__*/React.createElement("input", {
    placeholder: queryPlaceholder,
    "aria-label": "Service recherch\xE9"
  })), !compact && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "sy-search__divider"
  }), /*#__PURE__*/React.createElement("span", {
    className: "sy-search__seg",
    style: {
      maxWidth: 190
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 20 20",
    fill: "none",
    style: {
      color: "var(--text-muted)",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 17.5s5.5-4.6 5.5-8.4A5.5 5.5 0 004.5 9.1c0 3.8 5.5 8.4 5.5 8.4z",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinejoin: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "10",
    cy: "9",
    r: "2",
    stroke: "currentColor",
    strokeWidth: "1.7"
  })), /*#__PURE__*/React.createElement("input", {
    placeholder: placePlaceholder,
    "aria-label": "Commune"
  }))), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "sy-btn sy-btn--primary sy-btn--md"
  }, action));
}
Object.assign(__ds_scope, { SearchBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/marketplace/SearchBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ["sy-tabs", className].filter(Boolean).join(" "),
    role: "tablist"
  }, items.map(it => {
    const id = it.id ?? it;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      role: "tab",
      "aria-selected": value === id,
      className: ["sy-tab", value === id ? "sy-tab--active" : ""].filter(Boolean).join(" "),
      onClick: () => onChange && onChange(id)
    }, it.label ?? it, it.count != null && /*#__PURE__*/React.createElement("span", {
      className: "sy-tab__count"
    }, it.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/android/Screens.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  IconButton,
  Card,
  Badge,
  Tag,
  Avatar,
  Rating,
  Tabs,
  SearchBar,
  CategoryTile,
  ProviderCard,
  Input,
  Textarea,
  Select,
  Radio,
  Checkbox,
  Switch
} = window.ServisYakroDesignSystem_b6c27b;
const scroll = {
  flex: 1,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch"
};
function MHome({
  onSearch,
  onProvider
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: scroll
  }, /*#__PURE__*/React.createElement("div", {
    className: "sy-weave",
    style: {
      backgroundColor: "var(--kola-50)",
      padding: "18px 16px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: 20,
      letterSpacing: "-.03em"
    }
  }, "servis", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--brand)"
    }
  }, "yakro")), /*#__PURE__*/React.createElement(IconButton, {
    label: "Notifications"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "bell",
    width: "20"
  }))), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--text-h1)",
      fontSize: 28,
      marginTop: 16
    }
  }, "Bonjour Adjoua,", /*#__PURE__*/React.createElement("br", null), "quel service aujourd'hui ?"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    },
    onClick: onSearch
  }, /*#__PURE__*/React.createElement(SearchBar, {
    compact: true,
    action: "OK"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 16px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--text-h3)"
    }
  }, "Cat\xE9gories"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onSearch();
    },
    style: {
      font: "var(--text-small)"
    }
  }, "Tout voir")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
      marginTop: 12
    }
  }, window.CATEGORIES.slice(0, 6).map(c => /*#__PURE__*/React.createElement(CategoryTile, {
    key: c.label,
    label: c.label,
    count: c.count,
    onClick: onSearch,
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": c.icon,
      width: "22",
      strokeWidth: "1.75"
    })
  }))), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--text-h3)",
      marginTop: 26
    }
  }, "Pr\xE8s de vous"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12,
      marginTop: 12,
      paddingBottom: 24
    }
  }, window.PROVIDERS.slice(0, 3).map(p => /*#__PURE__*/React.createElement(ProviderCard, _extends({
    key: p.name
  }, p, {
    onClick: () => onProvider(p),
    onAction: () => onProvider(p)
  }))))));
}
function MResults({
  onProvider,
  onFilters
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: scroll
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 16px 0",
      background: "var(--surface-card)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement(SearchBar, {
    compact: true,
    action: "OK"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      padding: "12px 0"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "sy-tag",
    onClick: onFilters,
    style: {
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "sliders-horizontal",
    width: "15"
  }), " Filtres"), /*#__PURE__*/React.createElement(Tag, {
    selected: true
  }, "Plomberie"), /*#__PURE__*/React.createElement(Tag, null, "V\xE9rifi\xE9s"), /*#__PURE__*/React.createElement(Tag, null, "Aujourd'hui"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 16px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)",
      marginBottom: 12
    }
  }, "5 plombiers \xE0 Yamoussoukro"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12
    }
  }, window.PROVIDERS.map(p => /*#__PURE__*/React.createElement(ProviderCard, _extends({
    key: p.name
  }, p, {
    action: "Voir",
    onClick: () => onProvider(p),
    onAction: () => onProvider(p)
  }))))));
}
function MProvider({
  provider,
  onRequest
}) {
  const p = provider || window.PROVIDERS[0];
  const [tab, setTab] = React.useState("apropos");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: scroll
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 16px 0",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.name,
    size: "lg",
    verified: p.verified,
    style: {
      width: 76,
      height: 76,
      fontSize: 26
    }
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--text-h2)",
      marginTop: 12
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-default)",
      color: "var(--text-muted)",
      marginTop: 2
    }
  }, p.trade, " \xB7 ", p.commune), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 10,
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Rating, {
    value: p.rating,
    count: p.reviews
  }), p.verified && /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "V\xE9rifi\xE9")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 8,
      marginTop: 18
    }
  }, [[p.jobs, "interventions"], [p.since, "sur Yakro"], ["18 min", "de réponse"]].map(([n, l]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      background: "var(--surface-sunken)",
      borderRadius: "var(--radius-md)",
      padding: "10px 6px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)"
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-caption)",
      color: "var(--text-muted)"
    }
  }, l))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 16px 0"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      id: "apropos",
      label: "À propos"
    }, {
      id: "avis",
      label: "Avis",
      count: p.reviews
    }, {
      id: "tarifs",
      label: "Tarifs"
    }]
  }), tab === "apropos" && /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 16
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--text-body-default)",
      color: "var(--text-body)"
    }
  }, p.bio), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 16,
      flexWrap: "wrap"
    }
  }, ["Recherche de fuite", "Débouchage", "Chauffe-eau", "Urgence 7j/7"].map(s => /*#__PURE__*/React.createElement(Tag, {
    key: s
  }, s)))), tab === "avis" && /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 16,
      display: "grid",
      gap: 12
    }
  }, window.REVIEWS.map(r => /*#__PURE__*/React.createElement(Card, {
    key: r.name,
    padded: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: r.name,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)"
    }
  }, r.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-caption)",
      color: "var(--text-subtle)"
    }
  }, r.when)), /*#__PURE__*/React.createElement(Rating, {
    value: r.stars,
    showValue: false,
    size: 12
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-body)",
      marginTop: 8
    }
  }, r.text)))), tab === "tarifs" && /*#__PURE__*/React.createElement(Card, {
    style: {
      marginTop: 16
    }
  }, [["Déplacement", "3 000 F"], ["Recherche de fuite", "8 000 F"], ["Débouchage", "10 000 F"]].map(([l, v], i) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "14px 16px",
      borderTop: i ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-body-default)"
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 16px",
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--surface-card)",
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Appeler",
    variant: "outline"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "phone",
    width: "19"
  })), /*#__PURE__*/React.createElement(Button, {
    block: true,
    onClick: onRequest
  }, "Envoyer une demande")));
}
function MRequest({
  provider,
  onSend
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...scroll,
      padding: "16px 16px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Type de service",
    options: ["Recherche de fuite", "Débouchage", "Installation sanitaire", "Autre"]
  }), /*#__PURE__*/React.createElement(Textarea, {
    label: "Que se passe-t-il ?",
    placeholder: "Ex : fuite sous l'\xE9vier, depuis hier soir."
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sy-field__label",
    style: {
      marginBottom: 10
    }
  }, "Quand ?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    name: "mq",
    defaultChecked: true,
    label: "D\xE8s que possible"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "mq",
    label: "Aujourd'hui"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "mq",
    label: "\xC0 une date pr\xE9cise"
  }))), /*#__PURE__*/React.createElement(Select, {
    label: "Commune",
    options: ["Yamoussoukro centre", "Kokrenou", "Habitat", "N'Zuessy"]
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Quartier ou rep\xE8re",
    placeholder: "Derri\xE8re la pharmacie du march\xE9",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "map-pin",
      width: "16"
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Num\xE9ro de t\xE9l\xE9phone",
    defaultValue: "07 58 21 40 09",
    hint: "Utilis\xE9 uniquement pour cette demande."
  }), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Pr\xE9venir aussi 2 autres plombiers"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 16px",
      borderTop: "1px solid var(--border-subtle)",
      background: "var(--surface-card)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    block: true,
    size: "lg",
    onClick: onSend
  }, "Envoyer la demande")));
}
function MDemandes({
  onProvider
}) {
  const [tab, setTab] = React.useState("en-cours");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...scroll,
      padding: "12px 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      id: "en-cours",
      label: "En cours",
      count: 2
    }, {
      id: "terminees",
      label: "Terminées",
      count: 7
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 12,
      marginTop: 16
    }
  }, (tab === "en-cours" ? [["Koffi Yao", "Recherche de fuite", "En attente de réponse", "warning", "DEM-2026-04871"], ["Aya Traoré", "Débouchage", "Acceptée · mardi 14 avril", "success", "DEM-2026-04863"]] : [["Bamba Sékou", "Pose de chauffe-eau", "Terminée · 12 000 F", "neutral", "DEM-2026-04710"], ["Fatou Diomandé", "Entretien pompe", "Terminée · 9 000 F", "neutral", "DEM-2026-04688"]]).map(([name, svc, status, tone, ref]) => /*#__PURE__*/React.createElement(Card, {
    key: ref,
    padded: true,
    interactive: true,
    onClick: () => onProvider(window.PROVIDERS.find(p => p.name === name))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: name,
    size: "md"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)"
    }
  }, svc), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)"
    }
  }, name)), /*#__PURE__*/React.createElement(Badge, {
    tone: tone
  }, status.split(" · ")[0])), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: 12,
      font: "var(--text-caption)",
      color: "var(--text-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)"
    }
  }, ref), /*#__PURE__*/React.createElement("span", null, status.includes(" · ") ? status.split(" · ")[1] : "il y a 2 h"))))));
}
function MCompte() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...scroll,
      padding: "16px 16px 24px"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padded: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Adjoua Kouam\xE9",
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-h3)"
    }
  }, "Adjoua Kouam\xE9"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)"
    }
  }, "07 58 21 40 09 \xB7 Kokrenou")))), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginTop: 16
    }
  }, [["Alertes SMS", true], ["Notifications push", true], ["Partager ma position", false]].map(([l, v], i) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      padding: "14px 16px",
      borderTop: i ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    defaultChecked: v,
    label: l
  })))), /*#__PURE__*/React.createElement(Card, {
    style: {
      marginTop: 16
    }
  }, ["Mes favoris", "Moyens de paiement", "Aide et contact", "Devenir prestataire"].map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px",
      borderTop: i ? "1px solid var(--border-subtle)" : "none",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-body-default)"
    }
  }, l), /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chevron-right",
    width: "18",
    style: {
      color: "var(--text-subtle)"
    }
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    block: true
  }, "Se d\xE9connecter")));
}
function FilterSheet({
  onClose
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      zIndex: 40,
      background: "var(--scrim)",
      display: "flex",
      alignItems: "flex-end"
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      background: "var(--surface-card)",
      borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
      padding: "8px 16px 20px",
      maxHeight: "80%",
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 4,
      borderRadius: 2,
      background: "var(--border-strong)",
      margin: "8px auto 16px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-h3)",
      marginBottom: 16
    }
  }, "Filtres"), /*#__PURE__*/React.createElement(Select, {
    label: "Commune",
    options: ["Toutes les communes", "Yamoussoukro centre", "Kokrenou", "Habitat"]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      font: "var(--text-caption)",
      fontWeight: 600,
      marginBottom: 10
    }
  }, "Disponibilit\xE9"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    name: "fs",
    defaultChecked: true,
    label: "Peu importe"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "fs",
    label: "Aujourd'hui"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "fs",
    label: "Ce week-end"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18,
      font: "var(--text-caption)",
      fontWeight: 600,
      marginBottom: 10
    }
  }, "Confiance"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Identit\xE9 v\xE9rifi\xE9e"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Note sup\xE9rieure \xE0 4,5"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 22
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    block: true,
    onClick: onClose
  }, "R\xE9initialiser"), /*#__PURE__*/React.createElement(Button, {
    block: true,
    onClick: onClose
  }, "Voir les r\xE9sultats"))));
}
Object.assign(window, {
  MHome,
  MResults,
  MProvider,
  MRequest,
  MDemandes,
  MCompte,
  FilterSheet
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/android/Screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/android/Shell.jsx
try { (() => {
const {
  IconButton,
  Badge
} = window.ServisYakroDesignSystem_b6c27b;
function StatusBar() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 28,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 18px",
      font: "var(--text-caption)",
      fontWeight: 700,
      color: "var(--text-strong)",
      background: "transparent"
    }
  }, /*#__PURE__*/React.createElement("span", null, "09:41"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "signal",
    width: "13"
  }), /*#__PURE__*/React.createElement("i", {
    "data-lucide": "wifi",
    width: "13"
  }), /*#__PURE__*/React.createElement("i", {
    "data-lucide": "battery-full",
    width: "15"
  })));
}
function TopBar({
  title,
  onBack,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      height: 56,
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "0 8px",
      background: "rgba(255,255,255,.94)",
      backdropFilter: "var(--blur-sheet)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, onBack && /*#__PURE__*/React.createElement(IconButton, {
    label: "Retour",
    onClick: onBack
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "arrow-left",
    width: "20"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-h3)",
      fontSize: 17,
      paddingLeft: onBack ? 0 : 10
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex"
    }
  }, action));
}
function BottomNav({
  value,
  onChange
}) {
  const items = [["accueil", "house", "Accueil"], ["recherche", "search", "Recherche"], ["demandes", "clipboard-list", "Demandes"], ["compte", "user", "Compte"]];
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: "sticky",
      bottom: 0,
      zIndex: 20,
      height: 64,
      background: "var(--surface-card)",
      borderTop: "1px solid var(--border-subtle)",
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)"
    }
  }, items.map(([id, icon, label]) => {
    const on = value === id;
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      onClick: () => onChange(id),
      style: {
        border: "none",
        background: "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        color: on ? "var(--brand)" : "var(--text-muted)"
      }
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": icon,
      width: "21",
      strokeWidth: on ? 2.1 : 1.75
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        font: "var(--text-caption)",
        fontSize: 11,
        fontWeight: on ? 700 : 500
      }
    }, label));
  }));
}
function Phone({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 390,
      height: 800,
      background: "var(--surface-page)",
      borderRadius: 34,
      border: "1px solid var(--border-default)",
      boxShadow: "var(--shadow-lg)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      position: "relative"
    }
  }, children);
}
Object.assign(window, {
  StatusBar,
  TopBar,
  BottomNav,
  Phone
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/android/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/android/app-root.jsx
try { (() => {
const {
  Toast
} = window.ServisYakroDesignSystem_b6c27b;
function App() {
  const [tab, setTab] = React.useState("accueil");
  const [stack, setStack] = React.useState([]);
  const [provider, setProvider] = React.useState(null);
  const [sheet, setSheet] = React.useState(false);
  const [toast, setToast] = React.useState(false);
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const top = stack[stack.length - 1];
  const push = v => setStack(s => [...s, v]);
  const pop = () => setStack(s => s.slice(0, -1));
  const openProvider = p => {
    setProvider(p);
    push("provider");
  };
  let title = {
    accueil: "Accueil",
    recherche: "Recherche",
    demandes: "Mes demandes",
    compte: "Mon compte"
  }[tab];
  let body,
    back = null;
  if (top === "provider") {
    title = "Profil prestataire";
    back = pop;
    body = /*#__PURE__*/React.createElement(window.MProvider, {
      provider: provider,
      onRequest: () => push("request")
    });
  } else if (top === "request") {
    title = "Nouvelle demande";
    back = pop;
    body = /*#__PURE__*/React.createElement(window.MRequest, {
      provider: provider,
      onSend: () => {
        setStack([]);
        setTab("demandes");
        setToast(true);
      }
    });
  } else if (tab === "accueil") body = /*#__PURE__*/React.createElement(window.MHome, {
    onSearch: () => setTab("recherche"),
    onProvider: openProvider
  });else if (tab === "recherche") body = /*#__PURE__*/React.createElement(window.MResults, {
    onProvider: openProvider,
    onFilters: () => setSheet(true)
  });else if (tab === "demandes") body = /*#__PURE__*/React.createElement(window.MDemandes, {
    onProvider: openProvider
  });else body = /*#__PURE__*/React.createElement(window.MCompte, null);
  const showTop = tab !== "accueil" || !!top;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: "var(--argile-100)"
    }
  }, /*#__PURE__*/React.createElement(window.Phone, null, /*#__PURE__*/React.createElement(window.StatusBar, null), showTop && /*#__PURE__*/React.createElement(window.TopBar, {
    title: title,
    onBack: back
  }), body, !top && /*#__PURE__*/React.createElement(window.BottomNav, {
    value: tab,
    onChange: setTab
  }), sheet && /*#__PURE__*/React.createElement(window.FilterSheet, {
    onClose: () => setSheet(false)
  }), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 84,
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    title: "Demande envoy\xE9e",
    description: "3 prestataires ont \xE9t\xE9 pr\xE9venus."
  }))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/android/app-root.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/Chrome.jsx
try { (() => {
const {
  Button,
  IconButton,
  SearchBar,
  Avatar,
  Badge
} = window.ServisYakroDesignSystem_b6c27b;
function Wordmark({
  dark = false,
  size = 22
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 800,
      fontSize: size,
      letterSpacing: "-.03em",
      color: dark ? "#fff" : "var(--text-strong)",
      whiteSpace: "nowrap"
    }
  }, "servis", /*#__PURE__*/React.createElement("span", {
    style: {
      color: dark ? "var(--kola-400)" : "var(--brand)"
    }
  }, "yakro"));
}
function Header({
  onHome,
  onSearch,
  showSearch
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 30,
      height: 72,
      background: "rgba(255,255,255,.92)",
      backdropFilter: "var(--blur-sheet)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 32px",
      height: 72,
      display: "flex",
      alignItems: "center",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onHome();
    },
    style: {
      borderBottom: "none",
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(Wordmark, null)), showSearch && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      maxWidth: 480
    }
  }, /*#__PURE__*/React.createElement(SearchBar, {
    compact: true,
    action: "Chercher",
    onSubmit: onSearch
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Devenir prestataire"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "Aide"), /*#__PURE__*/React.createElement(IconButton, {
    label: "Notifications"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "bell",
    width: "18"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginLeft: 6
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Adjoua Kouam\xE9",
    size: "sm"
  })))));
}
function Footer() {
  const cols = [["Services", ["Plomberie", "Électricité", "Coiffure & beauté", "Transport"]], ["Prestataires", ["Créer un profil", "Tarifs", "Vérification d'identité"]], ["Servis Yakro", ["À propos", "Contact", "Conditions d'utilisation"]]];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--argile-900)",
      color: "rgba(255,255,255,.72)",
      marginTop: 80
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "56px 32px 40px",
      display: "grid",
      gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Wordmark, {
    dark: true,
    size: 24
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      font: "var(--text-small)",
      color: "rgba(255,255,255,.6)",
      maxWidth: 260
    }
  }, "Le bon prestataire, pr\xE8s de chez vous, \xE0 Yamoussoukro.")), cols.map(([t, items]) => /*#__PURE__*/React.createElement("div", {
    key: t
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-caption)",
      color: "#fff",
      fontWeight: 700,
      marginBottom: 12
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, items.map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      font: "var(--text-small)",
      color: "rgba(255,255,255,.62)"
    }
  }, i)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid rgba(255,255,255,.1)",
      padding: "18px 32px",
      font: "var(--text-caption)",
      color: "rgba(255,255,255,.45)",
      textAlign: "center"
    }
  }, "\xA9 2026 Servis Yakro \u2014 Yamoussoukro, C\xF4te d'Ivoire"));
}
Object.assign(window, {
  Wordmark,
  Header,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/Chrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/HomeScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  Card,
  Badge,
  SearchBar,
  CategoryTile,
  ProviderCard,
  Rating,
  Avatar
} = window.ServisYakroDesignSystem_b6c27b;
function HomeScreen({
  onSearch,
  onProvider
}) {
  const steps = [["Décrivez votre besoin", "Un métier, une commune, deux lignes d'explication."], ["Recevez des propositions", "Les prestataires disponibles vous répondent avec un tarif."], ["Choisissez et payez sur place", "Vous réglez le prestataire directement, après le travail."]];
  return /*#__PURE__*/React.createElement("main", null, /*#__PURE__*/React.createElement("section", {
    className: "sy-weave",
    style: {
      backgroundColor: "var(--kola-50)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "72px 32px 80px",
      display: "grid",
      gridTemplateColumns: "1.15fr .85fr",
      gap: 48,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-caption)",
      fontSize: 11,
      letterSpacing: ".12em",
      textTransform: "uppercase",
      fontWeight: 700,
      color: "var(--text-brand)"
    }
  }, "Yamoussoukro et environs"), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--text-display-1)",
      marginTop: 14
    }
  }, "Le bon prestataire,", /*#__PURE__*/React.createElement("br", null), "pr\xE8s de chez vous."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--text-body-lg)",
      color: "var(--text-body)",
      marginTop: 16,
      maxWidth: 460
    }
  }, "Plombiers, coiffeuses, ma\xE7ons, chauffeurs \u2014 tous contact\xE9s et v\xE9rifi\xE9s par t\xE9l\xE9phone avant d'appara\xEEtre ici."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28,
      maxWidth: 700,
      position: "relative",
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement(SearchBar, {
    onSubmit: onSearch
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)",
      alignSelf: "center",
      marginRight: 4
    }
  }, "Recherch\xE9 souvent :"), ["Plomberie", "Ménage", "Transport", "Coiffure"].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    className: "sy-tag",
    onClick: onSearch
  }, t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Card, {
    elevation: "md",
    padded: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "Bamba S\xE9kou",
    size: "md",
    verified: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)"
    }
  }, "Bamba S\xE9kou"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)"
    }
  }, "Plombier \xB7 N'Zuessy")), /*#__PURE__*/React.createElement(Rating, {
    value: 4.9,
    count: 210
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-body)",
      marginTop: 14
    }
  }, "\xAB J'ai re\xE7u trois demandes le premier jour. Aujourd'hui c'est la moiti\xE9 de mon activit\xE9. \xBB")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 12
    }
  }, [["1 240", "prestataires"], ["18 min", "de réponse"], ["4,7", "note moyenne"]].map(([n, l]) => /*#__PURE__*/React.createElement(Card, {
    key: l,
    padded: true,
    elevation: "none",
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-h2)",
      color: "var(--text-strong)"
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-caption)",
      color: "var(--text-muted)"
    }
  }, l))))))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "64px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--text-h2)"
    }
  }, "Que cherchez-vous ?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 16,
      marginTop: 20
    }
  }, window.CATEGORIES.map(c => /*#__PURE__*/React.createElement(CategoryTile, {
    key: c.label,
    label: c.label,
    count: c.count,
    onClick: onSearch,
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": c.icon,
      width: "22",
      height: "22",
      strokeWidth: "1.75"
    })
  })))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "64px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--text-h2)"
    }
  }, "Les mieux not\xE9s cette semaine"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onSearch();
    }
  }, "Voir tout")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 16,
      marginTop: 20
    }
  }, window.PROVIDERS.slice(0, 3).map(p => /*#__PURE__*/React.createElement(ProviderCard, _extends({
    key: p.name
  }, p, {
    onClick: () => onProvider(p),
    onAction: () => onProvider(p)
  }))))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "72px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-caption)",
      fontSize: 11,
      letterSpacing: ".12em",
      textTransform: "uppercase",
      fontWeight: 700,
      color: "var(--text-brand)"
    }
  }, "Comment \xE7a marche"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 24,
      marginTop: 20
    }
  }, steps.map(([t, d], i) => /*#__PURE__*/React.createElement("div", {
    key: t
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 999,
      background: "var(--argile-900)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-display)",
      fontWeight: 700
    }
  }, i + 1), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--text-h3)",
      marginTop: 14
    }
  }, t), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--text-body-default)",
      color: "var(--text-muted)",
      marginTop: 6
    }
  }, d))))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "72px auto 0",
      padding: "0 32px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sy-weave",
    style: {
      backgroundColor: "var(--argile-900)",
      borderRadius: "var(--radius-xl)",
      padding: "48px 56px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: "var(--text-h2)",
      color: "#fff"
    }
  }, "Vous \xEAtes artisan \xE0 Yakro ?"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--text-body-lg)",
      color: "rgba(255,255,255,.7)",
      marginTop: 8
    }
  }, "Cr\xE9ez votre profil en 5 minutes. L'inscription est gratuite.")), /*#__PURE__*/React.createElement(Button, {
    size: "lg"
  }, "Devenir prestataire"))));
}
Object.assign(window, {
  HomeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/ProviderScreen.jsx
try { (() => {
const {
  Button,
  IconButton,
  Card,
  Badge,
  Tag,
  Avatar,
  Rating,
  Tabs,
  Tooltip
} = window.ServisYakroDesignSystem_b6c27b;
function ProviderScreen({
  provider,
  onBack,
  onRequest
}) {
  const p = provider || window.PROVIDERS[0];
  const [tab, setTab] = React.useState("apropos");
  return /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "24px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "sy-btn sy-btn--ghost sy-btn--sm",
    onClick: onBack,
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "arrow-left",
    width: "16"
  }), " Retour aux r\xE9sultats"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 340px",
      gap: 32,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Card, {
    padded: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.name,
    size: "lg",
    verified: p.verified,
    style: {
      width: 88,
      height: 88,
      fontSize: 30
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--text-h1)"
    }
  }, p.name), p.verified && /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "V\xE9rifi\xE9")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-lg)",
      color: "var(--text-muted)",
      marginTop: 4
    }
  }, p.trade, " \xB7 ", p.commune), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 18,
      marginTop: 14,
      flexWrap: "wrap",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Rating, {
    value: p.rating,
    count: p.reviews,
    size: 16
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)"
    }
  }, p.jobs, " interventions"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)"
    }
  }, "Sur Servis Yakro depuis ", p.since))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Tooltip, {
    content: "Ajouter aux favoris"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Favori",
    variant: "outline"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "heart",
    width: "18"
  }))), /*#__PURE__*/React.createElement(Tooltip, {
    content: "Partager le profil"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Partager",
    variant: "outline"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "share-2",
    width: "18"
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      id: "apropos",
      label: "À propos"
    }, {
      id: "avis",
      label: "Avis",
      count: p.reviews
    }, {
      id: "tarifs",
      label: "Tarifs"
    }]
  })), tab === "apropos" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--text-body-lg)",
      color: "var(--text-body)",
      maxWidth: 640
    }
  }, p.bio), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--text-h3)",
      marginTop: 28
    }
  }, "Prestations"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 12,
      flexWrap: "wrap"
    }
  }, ["Recherche de fuite", "Débouchage", "Installation sanitaire", "Chauffe-eau", "Robinetterie", "Urgence 7j/7"].map(s => /*#__PURE__*/React.createElement(Tag, {
    key: s
  }, s))), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: "var(--text-h3)",
      marginTop: 28
    }
  }, "Zone d'intervention"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      height: 180,
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--border-subtle)",
      background: "var(--argile-50)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      font: "var(--text-small)",
      color: "var(--text-subtle)"
    }
  }, "Emplacement carte \u2014 aucun fond cartographique fourni")), tab === "avis" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24,
      display: "grid",
      gap: 14
    }
  }, window.REVIEWS.map(r => /*#__PURE__*/React.createElement(Card, {
    key: r.name,
    padded: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: r.name,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)"
    }
  }, r.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-caption)",
      color: "var(--text-subtle)"
    }
  }, r.when)), /*#__PURE__*/React.createElement(Rating, {
    value: r.stars,
    showValue: false
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--text-body-default)",
      color: "var(--text-body)",
      marginTop: 10
    }
  }, r.text)))), tab === "tarifs" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Card, null, [["Déplacement et diagnostic", "3 000 F"], ["Recherche de fuite", "à partir de 8 000 F"], ["Débouchage simple", "10 000 F"], ["Pose de chauffe-eau", "sur devis"]].map(([l, v], i) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "16px 20px",
      borderTop: i ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-body-default)"
    }
  }, l), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      color: "var(--text-strong)"
    }
  }, v)))), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)",
      marginTop: 12
    }
  }, "Tarifs indicatifs, \xE0 confirmer avec le prestataire."))), /*#__PURE__*/React.createElement(Card, {
    padded: true,
    elevation: "md",
    style: {
      position: "sticky",
      top: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-caption)",
      color: "var(--text-muted)"
    }
  }, "Tarif d'intervention"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-h2)",
      marginTop: 4
    }
  }, p.price), p.available && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    dot: true
  }, p.available)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10,
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Button, {
    block: true,
    onClick: onRequest
  }, "Envoyer une demande"), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    block: true,
    iconLeft: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "phone",
      width: "16"
    })
  }, "Appeler"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    block: true,
    iconLeft: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "message-circle",
      width: "16"
    })
  }, "\xC9crire un message")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-subtle)",
      margin: "20px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      font: "var(--text-small)",
      color: "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "shield-check",
    width: "18",
    style: {
      color: "var(--secondary)",
      flex: "none"
    }
  }), "Identit\xE9 et num\xE9ro v\xE9rifi\xE9s par Servis Yakro. Vous payez le prestataire directement, apr\xE8s le travail."))));
}
Object.assign(window, {
  ProviderScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/ProviderScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/RequestScreen.jsx
try { (() => {
const {
  Button,
  Card,
  Input,
  Textarea,
  Select,
  Radio,
  Checkbox,
  Avatar,
  Badge,
  Toast,
  Dialog
} = window.ServisYakroDesignSystem_b6c27b;
function RequestScreen({
  provider,
  onBack,
  onSent
}) {
  const p = provider || window.PROVIDERS[0];
  const [confirm, setConfirm] = React.useState(false);
  return /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "24px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "sy-btn sy-btn--ghost sy-btn--sm",
    onClick: onBack,
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "arrow-left",
    width: "16"
  }), " Retour au profil"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 340px",
      gap: 32,
      alignItems: "start",
      maxWidth: 1040
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--text-h1)"
    }
  }, "D\xE9crivez votre besoin"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: "var(--text-body-lg)",
      color: "var(--text-muted)",
      marginTop: 8
    }
  }, "Deux minutes suffisent. ", p.name.split(" ")[0], " re\xE7oit votre demande imm\xE9diatement."), /*#__PURE__*/React.createElement(Card, {
    padded: true,
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Type de service",
    options: ["Recherche de fuite", "Débouchage", "Installation sanitaire", "Chauffe-eau", "Autre"]
  }), /*#__PURE__*/React.createElement(Textarea, {
    label: "Que se passe-t-il ?",
    placeholder: "Ex : fuite sous l'\xE9vier de la cuisine, depuis hier soir."
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sy-field__label",
    style: {
      marginBottom: 10
    }
  }, "Quand ?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 24,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    name: "quand",
    defaultChecked: true,
    label: "D\xE8s que possible"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "quand",
    label: "Aujourd'hui"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "quand",
    label: "\xC0 une date pr\xE9cise"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Commune",
    options: ["Yamoussoukro centre", "Kokrenou", "Habitat", "N'Zuessy", "Dioulakro"]
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Quartier ou rep\xE8re",
    placeholder: "Ex : derri\xE8re la pharmacie du march\xE9",
    icon: /*#__PURE__*/React.createElement("i", {
      "data-lucide": "map-pin",
      width: "16"
    })
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Votre nom",
    defaultValue: "Adjoua Kouam\xE9"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Num\xE9ro de t\xE9l\xE9phone",
    defaultValue: "07 58 21 40 09",
    hint: "Utilis\xE9 uniquement pour cette demande."
  })), /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Envoyer aussi ma demande \xE0 2 autres plombiers disponibles"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    onClick: () => setConfirm(true)
  }, "Envoyer la demande"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "ghost",
    onClick: onBack
  }, "Annuler"))), /*#__PURE__*/React.createElement(Card, {
    padded: true,
    style: {
      position: "sticky",
      top: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-caption)",
      color: "var(--text-muted)",
      marginBottom: 12
    }
  }, "Votre prestataire"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.name,
    size: "md",
    verified: p.verified
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)"
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)"
    }
  }, p.trade, " \xB7 ", p.commune))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-subtle)",
      margin: "18px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      font: "var(--text-small)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "Tarif indicatif"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13
    }
  }, p.price)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      font: "var(--text-small)",
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "D\xE9placement"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13
    }
  }, "3 000 F")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "Paiement sur place, apr\xE8s le travail")))), /*#__PURE__*/React.createElement(Dialog, {
    open: confirm,
    title: "Confirmer la demande ?",
    description: "Le prestataire recevra votre numéro de téléphone et pourra vous rappeler.",
    onClose: () => setConfirm(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "outline",
      onClick: () => setConfirm(false)
    }, "Annuler"), /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      onClick: () => {
        setConfirm(false);
        onSent();
      }
    }, "Confirmer"))
  }));
}
Object.assign(window, {
  RequestScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/RequestScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/ResultsScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Button,
  Card,
  Tag,
  Badge,
  Checkbox,
  Radio,
  Select,
  ProviderCard,
  SearchBar,
  IconButton
} = window.ServisYakroDesignSystem_b6c27b;
function FilterRail() {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      position: "sticky",
      top: 96,
      alignSelf: "start",
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padded: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-body-strong)",
      marginBottom: 14
    }
  }, "Filtres"), /*#__PURE__*/React.createElement(Select, {
    label: "Commune",
    options: ["Toutes les communes", "Yamoussoukro centre", "Kokrenou", "Habitat", "N'Zuessy", "Dioulakro"]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-subtle)",
      margin: "18px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-caption)",
      fontWeight: 600,
      marginBottom: 10
    }
  }, "Disponibilit\xE9"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    name: "dispo",
    defaultChecked: true,
    label: "Peu importe"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "dispo",
    label: "Aujourd'hui"
  }), /*#__PURE__*/React.createElement(Radio, {
    name: "dispo",
    label: "Ce week-end"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-subtle)",
      margin: "18px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-caption)",
      fontWeight: 600,
      marginBottom: 10
    }
  }, "Confiance"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    label: "Identit\xE9 v\xE9rifi\xE9e"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Note sup\xE9rieure \xE0 4,5"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Plus de 50 avis"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-subtle)",
      margin: "18px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-caption)",
      fontWeight: 600,
      marginBottom: 10
    }
  }, "Budget"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Tag, null, "< 10 000 F"), /*#__PURE__*/React.createElement(Tag, null, "10\u201325 000 F"), /*#__PURE__*/React.createElement(Tag, null, "> 25 000 F"))), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    block: true
  }, "R\xE9initialiser les filtres"));
}
function ResultsScreen({
  onProvider,
  onSearch
}) {
  const [sort, setSort] = React.useState("Les mieux notés");
  return /*#__PURE__*/React.createElement("main", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "28px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)",
      marginBottom: 12
    }
  }, "Accueil \xB7 Plomberie \xB7 Yamoussoukro"), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720
    }
  }, /*#__PURE__*/React.createElement(SearchBar, {
    onSubmit: onSearch
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginTop: 18,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    selected: true,
    onRemove: () => {}
  }, "Plomberie"), /*#__PURE__*/React.createElement(Tag, {
    selected: true,
    onRemove: () => {}
  }, "Yamoussoukro"), /*#__PURE__*/React.createElement(Tag, {
    onRemove: () => {}
  }, "V\xE9rifi\xE9s")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 300px",
      gap: 32,
      marginTop: 24,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: "var(--text-h2)"
    }
  }, "5 plombiers \xE0 Yamoussoukro"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-small)",
      color: "var(--text-muted)"
    }
  }, "Trier :"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 180
    }
  }, /*#__PURE__*/React.createElement(Select, {
    value: sort,
    onChange: e => setSort(e.target.value),
    options: ["Les mieux notés", "Les plus proches", "Prix croissant", "Disponibles maintenant"]
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 14
    }
  }, window.PROVIDERS.map(p => /*#__PURE__*/React.createElement(ProviderCard, _extends({
    key: p.name
  }, p, {
    action: "Voir le profil",
    onClick: () => onProvider(p),
    onAction: () => onProvider(p)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "outline"
  }, "Afficher plus de prestataires"))), /*#__PURE__*/React.createElement(FilterRail, null)));
}
Object.assign(window, {
  ResultsScreen,
  FilterRail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/ResultsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/app-root.jsx
try { (() => {
const {
  Toast
} = window.ServisYakroDesignSystem_b6c27b;
function App() {
  const [route, setRoute] = React.useState("home");
  const [provider, setProvider] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const go = r => setRoute(r);
  const openProvider = p => {
    setProvider(p);
    setRoute("provider");
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(window.Header, {
    onHome: () => go("home"),
    onSearch: () => go("results"),
    showSearch: route !== "home"
  }), route === "home" && /*#__PURE__*/React.createElement(window.HomeScreen, {
    onSearch: () => go("results"),
    onProvider: openProvider
  }), route === "results" && /*#__PURE__*/React.createElement(window.ResultsScreen, {
    onProvider: openProvider,
    onSearch: () => go("results")
  }), route === "provider" && /*#__PURE__*/React.createElement(window.ProviderScreen, {
    provider: provider,
    onBack: () => go("results"),
    onRequest: () => go("request")
  }), route === "request" && /*#__PURE__*/React.createElement(window.RequestScreen, {
    provider: provider,
    onBack: () => go("provider"),
    onSent: () => {
      setToast(true);
      go("results");
    }
  }), /*#__PURE__*/React.createElement(window.Footer, null), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      left: 32,
      bottom: 32,
      zIndex: 80
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    title: "Demande envoy\xE9e",
    description: "3 prestataires ont \xE9t\xE9 pr\xE9venus. Vous serez rappel\xE9 sous peu."
  })));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/app-root.jsx", error: String((e && e.message) || e) }); }

// ui_kits/web/data.jsx
try { (() => {
const CATEGORIES = [{
  label: "Plomberie",
  icon: "wrench",
  count: 128
}, {
  label: "Électricité",
  icon: "zap",
  count: 96
}, {
  label: "Peinture",
  icon: "paint-roller",
  count: 74
}, {
  label: "Coiffure & beauté",
  icon: "scissors",
  count: 214
}, {
  label: "Transport",
  icon: "truck",
  count: 152
}, {
  label: "Maçonnerie",
  icon: "hammer",
  count: 61
}, {
  label: "Ménage",
  icon: "brush",
  count: 187
}, {
  label: "Informatique",
  icon: "laptop",
  count: 43
}];
const PROVIDERS = [{
  name: "Koffi Yao",
  trade: "Plombier",
  commune: "Kokrenou",
  rating: 4.8,
  reviews: 126,
  price: "à partir de 8 000 F",
  verified: true,
  available: "Disponible aujourd'hui",
  since: "2024",
  jobs: 214,
  bio: "Dépannage de fuites, installation sanitaire et pose de chauffe-eau. J'interviens dans tout Yamoussoukro, week-ends compris."
}, {
  name: "Aya Traoré",
  trade: "Plombière",
  commune: "Habitat",
  rating: 4.6,
  reviews: 83,
  price: "à partir de 7 500 F",
  verified: true,
  available: "Disponible demain",
  since: "2023",
  jobs: 141,
  bio: "Réparation de robinetterie et débouchage. Devis gratuit avant intervention."
}, {
  name: "Bamba Sékou",
  trade: "Plombier · Maçon",
  commune: "N'Zuessy",
  rating: 4.9,
  reviews: 210,
  price: "à partir de 10 000 F",
  verified: true,
  available: "Disponible aujourd'hui",
  since: "2022",
  jobs: 388,
  bio: "Plomberie complète et petits travaux de maçonnerie. Équipe de deux personnes."
}, {
  name: "Kouassi Désiré",
  trade: "Plombier",
  commune: "Yamoussoukro centre",
  rating: 4.3,
  reviews: 47,
  price: "à partir de 6 000 F",
  verified: false,
  price2: "",
  since: "2025",
  jobs: 52,
  bio: "Interventions rapides en journée sur le centre-ville."
}, {
  name: "Fatou Diomandé",
  trade: "Plombière",
  commune: "Dioulakro",
  rating: 4.7,
  reviews: 65,
  price: "à partir de 9 000 F",
  verified: true,
  available: "Disponible ce week-end",
  since: "2024",
  jobs: 98,
  bio: "Installation de systèmes d'eau et entretien de pompes."
}];
const REVIEWS = [{
  name: "Adjoua K.",
  when: "il y a 3 jours",
  stars: 5,
  text: "Intervention rapide, fuite réparée en une heure. Prix annoncé respecté."
}, {
  name: "Yao Michel",
  when: "il y a 2 semaines",
  stars: 5,
  text: "Sérieux et ponctuel. Il a expliqué ce qu'il faisait, c'est appréciable."
}, {
  name: "Mariam S.",
  when: "il y a 1 mois",
  stars: 4,
  text: "Bon travail sur le chauffe-eau. Un peu en retard mais il a prévenu."
}];
Object.assign(window, {
  CATEGORIES,
  PROVIDERS,
  REVIEWS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/web/data.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.CategoryTile = __ds_scope.CategoryTile;

__ds_ns.ProviderCard = __ds_scope.ProviderCard;

__ds_ns.Rating = __ds_scope.Rating;

__ds_ns.SearchBar = __ds_scope.SearchBar;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
