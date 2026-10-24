import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.jsx");const React = __vite__cjsImport0_react; const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport3_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=538c8e86";
import { Menu, X, Home, ShoppingCart, Box, ArrowDownRight, ArrowUpRight, FileText, CreditCard, PieChart, Package, Users, Briefcase, Activity, Settings, LogOut, Search, Bell, User, CheckCircle2, Palette, TrendingUp, Grid, FileSpreadsheet, Landmark, Filter, Plus, ChevronRight } from "/node_modules/.vite/deps/lucide-react.js?v=538c8e86";
import "/src/index.css?t=1792127625921";
var _jsxFileName = "D:/Prototype/tally-frontend/src/App.jsx";
import __vite__cjsImport3_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=538c8e86";
var _s = $RefreshSig$(), _s2 = $RefreshSig$();
const Dashboard = ({ setCurrentTab }) => {
	const actions = [
		{
			id: "sales",
			name: "Create Sales",
			icon: /* @__PURE__ */ _jsxDEV(FileText, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 12,
				columnNumber: 48
			}, this),
			color: "#ff3b30"
		},
		{
			id: "purchase",
			name: "Create Purchase",
			icon: /* @__PURE__ */ _jsxDEV(ShoppingCart, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 13,
				columnNumber: 54
			}, this),
			color: "#007aff"
		},
		{
			id: "receipt",
			name: "Receipt",
			icon: /* @__PURE__ */ _jsxDEV(ArrowDownRight, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 14,
				columnNumber: 45
			}, this),
			color: "#34c759"
		},
		{
			id: "payment",
			name: "Payment",
			icon: /* @__PURE__ */ _jsxDEV(ArrowUpRight, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 15,
				columnNumber: 45
			}, this),
			color: "#ff9500"
		},
		{
			id: "journal",
			name: "Journal",
			icon: /* @__PURE__ */ _jsxDEV(FileText, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 16,
				columnNumber: 45
			}, this),
			color: "#5856d6"
		},
		{
			id: "contra",
			name: "Contra",
			icon: /* @__PURE__ */ _jsxDEV(Landmark, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 17,
				columnNumber: 43
			}, this),
			color: "#ff2d55"
		}
	];
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "fade-in",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "page-header",
				children: /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h1", { children: "Dashboard" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 24,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Your business overview at a glance" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 25,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 23,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 22,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid-3",
				style: { marginBottom: "32px" },
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "glass-panel summary-card",
						children: [
							/* @__PURE__ */ _jsxDEV("h3", { children: "Receivable" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 31,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "amount",
								style: { color: "var(--success)" },
								children: "₹ 5,20,000"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 32,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "trend",
								style: { color: "var(--text-muted)" },
								children: "12 pending invoices"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 33,
								columnNumber: 11
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 30,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "glass-panel summary-card",
						children: [
							/* @__PURE__ */ _jsxDEV("h3", { children: "Payable" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 36,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "amount",
								style: { color: "var(--danger)" },
								children: "₹ 3,80,000"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 37,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "trend",
								style: { color: "var(--text-muted)" },
								children: "5 upcoming dues"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 38,
								columnNumber: 11
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 35,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "glass-panel summary-card",
						children: [
							/* @__PURE__ */ _jsxDEV("h3", { children: "Cash & Bank" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 41,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "amount",
								children: "₹ 14,50,000"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 42,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "trend",
								children: [
									/* @__PURE__ */ _jsxDEV(TrendingUp, {
										size: 16,
										color: "var(--success)"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 44,
										columnNumber: 13
									}, this),
									" ",
									/* @__PURE__ */ _jsxDEV("span", {
										style: { color: "var(--success)" },
										children: "Up 2.4% today"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 44,
										columnNumber: 61
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 43,
								columnNumber: 11
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 40,
						columnNumber: 9
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 29,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("h2", {
				className: "section-title",
				children: "Quick Actions"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 49,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid-6",
				style: { marginBottom: "32px" },
				children: actions.map((action) => /* @__PURE__ */ _jsxDEV("div", {
					className: "glass-panel hub-card",
					onClick: () => setCurrentTab(action.id),
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "hub-icon",
						style: { color: action.color },
						children: React.cloneElement(action.icon, { size: 28 })
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 57,
						columnNumber: 13
					}, this), /* @__PURE__ */ _jsxDEV("span", { children: action.name }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 60,
						columnNumber: 13
					}, this)]
				}, action.id, true, {
					fileName: _jsxFileName,
					lineNumber: 52,
					columnNumber: 11
				}, this))
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 50,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("h2", {
				className: "section-title",
				children: "Recent Activity"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 65,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "ios-list",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "list-item",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "list-left",
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "list-icon",
							style: { color: "#ff3b30" },
							children: /* @__PURE__ */ _jsxDEV(FileText, { size: 20 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 70,
								columnNumber: 15
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 69,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "list-text",
							children: [/* @__PURE__ */ _jsxDEV("h4", { children: "Ramesh Traders" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 73,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Sales Voucher • Today, 10:45 AM" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 74,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 72,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 68,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "list-right",
						children: [/* @__PURE__ */ _jsxDEV("h4", { children: "₹ 12,500" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 78,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("p", {
							style: {
								color: "var(--success)",
								display: "flex",
								alignItems: "center",
								gap: "4px",
								justifyContent: "flex-end"
							},
							children: [/* @__PURE__ */ _jsxDEV(CheckCircle2, { size: 14 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 79,
								columnNumber: 131
							}, this), " Done"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 79,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 77,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 67,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "list-item",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "list-left",
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "list-icon",
							style: { color: "#34c759" },
							children: /* @__PURE__ */ _jsxDEV(ArrowDownRight, { size: 20 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 85,
								columnNumber: 15
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 84,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "list-text",
							children: [/* @__PURE__ */ _jsxDEV("h4", { children: "Neha Sharma" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 88,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Receipt • Yesterday, 2:15 PM" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 89,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 87,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 83,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "list-right",
						children: [/* @__PURE__ */ _jsxDEV("h4", { children: "₹ 5,000" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 93,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("p", {
							style: {
								color: "var(--success)",
								display: "flex",
								alignItems: "center",
								gap: "4px",
								justifyContent: "flex-end"
							},
							children: [/* @__PURE__ */ _jsxDEV(CheckCircle2, { size: 14 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 94,
								columnNumber: 131
							}, this), " Done"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 94,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 92,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 82,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 66,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 21,
		columnNumber: 5
	}, this);
};
_c = Dashboard;
const CreateEntry = ({ type }) => {
	_s();
	const [items, setItems] = useState([{
		name: "",
		qty: 1,
		rate: 0,
		amount: 0
	}]);
	const handleItemChange = (index, field, value) => {
		const newItems = [...items];
		newItems[index][field] = value;
		if (field === "qty" || field === "rate") {
			newItems[index].amount = newItems[index].qty * newItems[index].rate;
		}
		setItems(newItems);
	};
	const addItem = () => setItems([...items, {
		name: "",
		qty: 1,
		rate: 0,
		amount: 0
	}]);
	const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
	const title = type.charAt(0).toUpperCase() + type.slice(1) + " Entry";
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "fade-in",
		children: [/* @__PURE__ */ _jsxDEV("div", {
			className: "page-header",
			children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h1", { children: title }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 123,
				columnNumber: 11
			}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Create a new transaction record" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 124,
				columnNumber: 11
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 122,
				columnNumber: 9
			}, this), /* @__PURE__ */ _jsxDEV("button", {
				className: "btn-primary",
				children: "Save Entry"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 126,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 121,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV("div", {
			className: "form-container",
			children: [
				/* @__PURE__ */ _jsxDEV("h3", {
					className: "section-title",
					style: { marginTop: 0 },
					children: "Basic Details"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 132,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "ios-form-group",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "ios-input-row",
						children: [/* @__PURE__ */ _jsxDEV("label", { children: "Date" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 135,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("input", {
							type: "date",
							defaultValue: new Date().toISOString().split("T")[0]
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 136,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 134,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "ios-input-row",
						children: [/* @__PURE__ */ _jsxDEV("label", { children: "Voucher No" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 139,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("input", {
							type: "text",
							value: `${type.substring(0, 3).toUpperCase()}-1024`,
							readOnly: true,
							style: { color: "rgba(0,0,0,0.4)" }
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 140,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 138,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 133,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("h3", {
					className: "section-title",
					children: "Party Details"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 144,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "ios-form-group",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "ios-input-row",
						children: [/* @__PURE__ */ _jsxDEV("label", { children: "Party A/c" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 147,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("select", { children: [
							/* @__PURE__ */ _jsxDEV("option", {
								value: "",
								children: "Select Party..."
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 149,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("option", {
								value: "1",
								children: "Ramesh Traders"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 150,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("option", {
								value: "2",
								children: "Neha Sharma"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 151,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("option", {
								value: "3",
								children: "Cash"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 152,
								columnNumber: 15
							}, this)
						] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 148,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 146,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "ios-input-row",
						children: [/* @__PURE__ */ _jsxDEV("label", { children: "Ledger" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 156,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("input", {
							type: "text",
							defaultValue: `Local ${type.charAt(0).toUpperCase() + type.slice(1)}`
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 157,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 155,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 145,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("h3", {
					className: "section-title",
					children: "Items"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 161,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "ios-form-group",
					style: { padding: "16px 20px" },
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							style: {
								display: "grid",
								gridTemplateColumns: "2fr 1fr 1fr 1fr",
								gap: "8px",
								marginBottom: "8px",
								fontSize: "13px",
								color: "rgba(0,0,0,0.5)",
								fontWeight: "600"
							},
							children: [
								/* @__PURE__ */ _jsxDEV("div", { children: "Item" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 164,
									columnNumber: 13
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									style: { textAlign: "right" },
									children: "Qty"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 165,
									columnNumber: 13
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									style: { textAlign: "right" },
									children: "Rate"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 166,
									columnNumber: 13
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									style: { textAlign: "right" },
									children: "Amount"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 167,
									columnNumber: 13
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 163,
							columnNumber: 11
						}, this),
						items.map((item, index) => /* @__PURE__ */ _jsxDEV("div", {
							style: {
								display: "grid",
								gridTemplateColumns: "2fr 1fr 1fr 1fr",
								gap: "8px",
								marginBottom: "16px",
								alignItems: "center"
							},
							children: [
								/* @__PURE__ */ _jsxDEV("div", { children: /* @__PURE__ */ _jsxDEV("input", {
									type: "text",
									placeholder: "Name",
									value: item.name,
									onChange: (e) => handleItemChange(index, "name", e.target.value),
									style: {
										width: "100%",
										padding: "10px",
										borderRadius: "8px",
										border: "none",
										background: "rgba(0,0,0,0.05)",
										fontSize: "15px",
										fontWeight: 600
									}
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 173,
									columnNumber: 17
								}, this) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 172,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", { children: /* @__PURE__ */ _jsxDEV("input", {
									type: "number",
									placeholder: "Qty",
									value: item.qty,
									onChange: (e) => handleItemChange(index, "qty", Number(e.target.value)),
									style: {
										width: "100%",
										padding: "10px",
										borderRadius: "8px",
										border: "none",
										background: "rgba(0,0,0,0.05)",
										fontSize: "15px",
										textAlign: "right",
										fontWeight: 600
									}
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 176,
									columnNumber: 17
								}, this) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 175,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", { children: /* @__PURE__ */ _jsxDEV("input", {
									type: "number",
									placeholder: "Rate",
									value: item.rate,
									onChange: (e) => handleItemChange(index, "rate", Number(e.target.value)),
									style: {
										width: "100%",
										padding: "10px",
										borderRadius: "8px",
										border: "none",
										background: "rgba(0,0,0,0.05)",
										fontSize: "15px",
										textAlign: "right",
										fontWeight: 600
									}
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 179,
									columnNumber: 17
								}, this) }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 178,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ _jsxDEV("div", {
									style: {
										textAlign: "right",
										fontSize: "16px",
										fontWeight: "700"
									},
									children: ["₹ ", item.amount.toFixed(2)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 181,
									columnNumber: 15
								}, this)
							]
						}, index, true, {
							fileName: _jsxFileName,
							lineNumber: 171,
							columnNumber: 13
						}, this)),
						/* @__PURE__ */ _jsxDEV("button", {
							onClick: addItem,
							style: {
								background: "transparent",
								border: "none",
								color: "var(--primary-color)",
								fontSize: "15px",
								fontWeight: "600",
								cursor: "pointer",
								padding: "8px 0",
								display: "flex",
								alignItems: "center",
								gap: "4px"
							},
							children: [/* @__PURE__ */ _jsxDEV(Plus, { size: 16 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 188,
								columnNumber: 13
							}, this), " Add Item"]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 187,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 162,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ _jsxDEV("div", {
					className: "ios-form-group",
					children: /* @__PURE__ */ _jsxDEV("div", {
						className: "ios-input-row",
						style: {
							border: "none",
							paddingTop: "24px",
							paddingBottom: "24px"
						},
						children: [/* @__PURE__ */ _jsxDEV("label", {
							style: { fontSize: "20px" },
							children: "Total Amount"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 194,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							style: {
								flex: 1,
								textAlign: "right",
								fontSize: "32px",
								fontWeight: "700",
								color: "var(--text-dark)"
							},
							children: ["₹ ", totalAmount.toFixed(2)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 195,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 193,
						columnNumber: 11
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 192,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 131,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 120,
		columnNumber: 5
	}, this);
};
_s(CreateEntry, "ip6w1RJtxJ43v768R/YCZIrOgBM=");
_c2 = CreateEntry;
const OutstandingHub = () => {
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "fade-in",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "page-header",
				children: /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h1", { children: "Outstanding" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 210,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Track your receivables and payables" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 211,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 209,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 208,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid-2",
				style: { marginBottom: "32px" },
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "glass-panel summary-card",
					style: { alignItems: "center" },
					children: [
						/* @__PURE__ */ _jsxDEV("h3", { children: "Total Receivable (Money to receive)" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 217,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "amount",
							style: { color: "var(--success)" },
							children: "₹ 5,20,000"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 218,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV("button", {
							className: "btn-primary",
							style: {
								marginTop: "16px",
								width: "100%"
							},
							children: "View Receivable"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 219,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 216,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "glass-panel summary-card",
					style: { alignItems: "center" },
					children: [
						/* @__PURE__ */ _jsxDEV("h3", { children: "Total Payable (Money to pay)" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 222,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "amount",
							style: { color: "var(--danger)" },
							children: "₹ 3,80,000"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 223,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV("button", {
							className: "btn-primary",
							style: {
								marginTop: "16px",
								width: "100%",
								background: "var(--danger)"
							},
							children: "View Payable"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 224,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 221,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 215,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("h2", {
				className: "section-title",
				children: "Top Overdue"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 228,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "ios-list",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "list-item",
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							className: "list-left",
							children: /* @__PURE__ */ _jsxDEV("div", {
								className: "list-text",
								children: [/* @__PURE__ */ _jsxDEV("h4", { children: "Super Wholesalers" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 233,
									columnNumber: 15
								}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Invoice #1042 • 5 days overdue" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 234,
									columnNumber: 15
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 232,
								columnNumber: 13
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 231,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "list-right",
							children: /* @__PURE__ */ _jsxDEV("h4", {
								style: { color: "var(--danger)" },
								children: "₹ 45,000"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 238,
								columnNumber: 13
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 237,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV(ChevronRight, {
							size: 20,
							color: "rgba(0,0,0,0.3)"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 240,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 230,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "list-item",
					children: [
						/* @__PURE__ */ _jsxDEV("div", {
							className: "list-left",
							children: /* @__PURE__ */ _jsxDEV("div", {
								className: "list-text",
								children: [/* @__PURE__ */ _jsxDEV("h4", { children: "City Distributors" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 245,
									columnNumber: 15
								}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Invoice #1055 • Due in 2 days" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 246,
									columnNumber: 15
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 244,
								columnNumber: 13
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 243,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV("div", {
							className: "list-right",
							children: /* @__PURE__ */ _jsxDEV("h4", {
								style: { color: "var(--text-dark)" },
								children: "₹ 12,500"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 250,
								columnNumber: 13
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 249,
							columnNumber: 11
						}, this),
						/* @__PURE__ */ _jsxDEV(ChevronRight, {
							size: 20,
							color: "rgba(0,0,0,0.3)"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 252,
							columnNumber: 11
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 242,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 229,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 207,
		columnNumber: 5
	}, this);
};
_c3 = OutstandingHub;
const ItemsHub = () => {
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "fade-in",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "page-header",
				children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h1", { children: "Items" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 264,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Manage your inventory and stock" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 265,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 263,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("button", {
					className: "btn-primary",
					children: [/* @__PURE__ */ _jsxDEV(Plus, { size: 18 }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 267,
						columnNumber: 41
					}, this), " Add Item"]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 267,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 262,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				style: {
					display: "flex",
					gap: "12px",
					marginBottom: "24px"
				},
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "header-search",
					style: {
						width: "100%",
						maxWidth: "400px",
						background: "rgba(255,255,255,0.6)"
					},
					children: [/* @__PURE__ */ _jsxDEV(Search, {
						size: 18,
						color: "rgba(0,0,0,0.4)"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 272,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("input", {
						type: "text",
						placeholder: "Search Items..."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 273,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 271,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("button", {
					className: "icon-btn",
					style: { background: "rgba(255,255,255,0.6)" },
					children: /* @__PURE__ */ _jsxDEV(Filter, { size: 18 }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 275,
						columnNumber: 86
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 275,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 270,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "ios-table-container",
				children: /* @__PURE__ */ _jsxDEV("table", {
					className: "ios-table",
					children: [/* @__PURE__ */ _jsxDEV("thead", { children: /* @__PURE__ */ _jsxDEV("tr", { children: [
						/* @__PURE__ */ _jsxDEV("th", { children: "Item Name" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 282,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV("th", { children: "Category" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 283,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV("th", { children: "Stock" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 284,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV("th", { children: "Rate" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 285,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ _jsxDEV("th", { children: "Status" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 286,
							columnNumber: 15
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 281,
						columnNumber: 13
					}, this) }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 280,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("tbody", { children: [
						/* @__PURE__ */ _jsxDEV("tr", { children: [
							/* @__PURE__ */ _jsxDEV("td", { children: "Premium Notebook" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 291,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: "Stationery" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 292,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: "120 Pcs" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 293,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: "₹ 50.00" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 294,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: /* @__PURE__ */ _jsxDEV("span", {
								className: "badge badge-success",
								children: "In Stock"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 295,
								columnNumber: 19
							}, this) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 295,
								columnNumber: 15
							}, this)
						] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 290,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("tr", { children: [
							/* @__PURE__ */ _jsxDEV("td", { children: "Blue Ink Pen" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 298,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: "Stationery" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 299,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: "5 Pcs" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 300,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: "₹ 10.00" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 301,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: /* @__PURE__ */ _jsxDEV("span", {
								className: "badge badge-warning",
								children: "Low Stock"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 302,
								columnNumber: 19
							}, this) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 302,
								columnNumber: 15
							}, this)
						] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 297,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ _jsxDEV("tr", { children: [
							/* @__PURE__ */ _jsxDEV("td", { children: "Office Chair" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 305,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: "Furniture" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 306,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: "25 Pcs" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 307,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: "₹ 4,500.00" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 308,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ _jsxDEV("td", { children: /* @__PURE__ */ _jsxDEV("span", {
								className: "badge badge-success",
								children: "In Stock"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 309,
								columnNumber: 19
							}, this) }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 309,
								columnNumber: 15
							}, this)
						] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 304,
							columnNumber: 13
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 289,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 279,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 278,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 261,
		columnNumber: 5
	}, this);
};
_c4 = ItemsHub;
const PartiesHub = () => {
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "fade-in",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "page-header",
				children: [/* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h1", { children: "Parties" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 323,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Customers, Suppliers & All Parties" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 324,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 322,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("button", {
					className: "btn-primary",
					children: [/* @__PURE__ */ _jsxDEV(Plus, { size: 18 }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 326,
						columnNumber: 41
					}, this), " Add Party"]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 326,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 321,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid-3",
				style: { marginBottom: "24px" },
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "glass-panel hub-card",
						style: {
							padding: "16px",
							flexDirection: "row",
							justifyContent: "flex-start"
						},
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "hub-icon",
							style: {
								width: 40,
								height: 40,
								color: "var(--success)"
							},
							children: /* @__PURE__ */ _jsxDEV(Users, { size: 20 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 331,
								columnNumber: 96
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 331,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							style: { fontSize: "16px" },
							children: "Customers"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 332,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 330,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "glass-panel hub-card",
						style: {
							padding: "16px",
							flexDirection: "row",
							justifyContent: "flex-start"
						},
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "hub-icon",
							style: {
								width: 40,
								height: 40,
								color: "var(--danger)"
							},
							children: /* @__PURE__ */ _jsxDEV(Briefcase, { size: 20 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 335,
								columnNumber: 95
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 335,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							style: { fontSize: "16px" },
							children: "Suppliers"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 336,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 334,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "glass-panel hub-card",
						style: {
							padding: "16px",
							flexDirection: "row",
							justifyContent: "flex-start",
							background: "rgba(255,255,255,0.7)"
						},
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "hub-icon",
							style: {
								width: 40,
								height: 40,
								color: "var(--primary-color)"
							},
							children: /* @__PURE__ */ _jsxDEV(Users, { size: 20 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 339,
								columnNumber: 102
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 339,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("span", {
							style: { fontSize: "16px" },
							children: "All Parties"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 340,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 338,
						columnNumber: 9
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 329,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "ios-list",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "list-item",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "list-left",
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "list-icon",
							style: {
								background: "var(--primary-color)",
								color: "white"
							},
							children: "R"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 347,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "list-text",
							children: [/* @__PURE__ */ _jsxDEV("h4", { children: "Ramesh Traders" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 349,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", { children: "+91 98765 43210 • Customer" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 350,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 348,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 346,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "list-right",
						children: [/* @__PURE__ */ _jsxDEV("h4", {
							style: { color: "var(--success)" },
							children: "₹ 12,500"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 354,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Receivable" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 355,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 353,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 345,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "list-item",
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "list-left",
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "list-icon",
							style: {
								background: "var(--danger)",
								color: "white"
							},
							children: "S"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 360,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "list-text",
							children: [/* @__PURE__ */ _jsxDEV("h4", { children: "Super Wholesalers" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 362,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("p", { children: "+91 99887 76655 • Supplier" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 363,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 361,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 359,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "list-right",
						children: [/* @__PURE__ */ _jsxDEV("h4", {
							style: { color: "var(--danger)" },
							children: "₹ 45,000"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 367,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Payable" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 368,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 366,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 358,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 344,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 320,
		columnNumber: 5
	}, this);
};
_c5 = PartiesHub;
const ReportsHub = () => {
	const reports = [
		{
			name: "Sales Reports",
			icon: /* @__PURE__ */ _jsxDEV(TrendingUp, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 378,
				columnNumber: 36
			}, this),
			color: "#ff3b30"
		},
		{
			name: "Purchase Reports",
			icon: /* @__PURE__ */ _jsxDEV(ShoppingCart, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 379,
				columnNumber: 39
			}, this),
			color: "#007aff"
		},
		{
			name: "Payment Reports",
			icon: /* @__PURE__ */ _jsxDEV(CreditCard, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 380,
				columnNumber: 38
			}, this),
			color: "#ff9500"
		},
		{
			name: "Outstanding Reports",
			icon: /* @__PURE__ */ _jsxDEV(FileSpreadsheet, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 381,
				columnNumber: 42
			}, this),
			color: "#5856d6"
		},
		{
			name: "Stock Reports",
			icon: /* @__PURE__ */ _jsxDEV(Package, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 382,
				columnNumber: 36
			}, this),
			color: "#34c759"
		},
		{
			name: "Business Reports",
			icon: /* @__PURE__ */ _jsxDEV(PieChart, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 383,
				columnNumber: 39
			}, this),
			color: "#af52de"
		},
		{
			name: "Accounting Reports",
			icon: /* @__PURE__ */ _jsxDEV(FileText, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 384,
				columnNumber: 41
			}, this),
			color: "#ff2d55"
		}
	];
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "fade-in",
		children: [/* @__PURE__ */ _jsxDEV("div", {
			className: "page-header",
			children: /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h1", { children: "Reports" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 390,
				columnNumber: 11
			}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Detailed insights into your business" }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 391,
				columnNumber: 11
			}, this)] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 389,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 388,
			columnNumber: 7
		}, this), /* @__PURE__ */ _jsxDEV("div", {
			className: "grid-4",
			children: reports.map((r, i) => /* @__PURE__ */ _jsxDEV("div", {
				className: "glass-panel hub-card",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "hub-icon",
					style: { color: r.color },
					children: React.cloneElement(r.icon, { size: 28 })
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 397,
					columnNumber: 13
				}, this), /* @__PURE__ */ _jsxDEV("span", { children: r.name }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 400,
					columnNumber: 13
				}, this)]
			}, i, true, {
				fileName: _jsxFileName,
				lineNumber: 396,
				columnNumber: 11
			}, this))
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 394,
			columnNumber: 7
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 387,
		columnNumber: 5
	}, this);
};
_c6 = ReportsHub;
const SettingsHub = ({ primaryColor, setPrimaryColor, bgImage, setBgImage, glassOpacity, setGlassOpacity }) => {
	const predefinedColors = [
		{
			name: "iOS Blue",
			value: "#007aff"
		},
		{
			name: "Tally Green",
			value: "#34c759"
		},
		{
			name: "Sunset Orange",
			value: "#ff9500"
		},
		{
			name: "Deep Purple",
			value: "#5856d6"
		},
		{
			name: "Rose Red",
			value: "#ff2d55"
		},
		{
			name: "Midnight Dark",
			value: "#1c1c1e"
		}
	];
	const predefinedBackgrounds = [
		{
			name: "Beach Sunrise",
			value: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2800&q=80"
		},
		{
			name: "Mountain Lake",
			value: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2800&q=80"
		},
		{
			name: "Abstract Liquid",
			value: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=2800&q=80"
		},
		{
			name: "Clean White",
			value: "https://images.unsplash.com/photo-1516880711640-ef7daf815e92?auto=format&fit=crop&w=2800&q=80"
		},
		{
			name: "Dark Space",
			value: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2800&q=80"
		}
	];
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "fade-in form-container",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: "page-header",
				children: /* @__PURE__ */ _jsxDEV("div", { children: [/* @__PURE__ */ _jsxDEV("h1", { children: "Settings" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 430,
					columnNumber: 11
				}, this), /* @__PURE__ */ _jsxDEV("p", { children: "Manage application preferences & Personalization" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 431,
					columnNumber: 11
				}, this)] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 429,
					columnNumber: 9
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 428,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "grid-3",
				style: { marginBottom: "32px" },
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "glass-panel hub-card",
						style: { padding: "20px" },
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "hub-icon",
							style: {
								width: 44,
								height: 44,
								color: "var(--primary-color)"
							},
							children: /* @__PURE__ */ _jsxDEV(Box, { size: 24 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 437,
								columnNumber: 102
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 437,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("span", { children: "Company" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 438,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 436,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "glass-panel hub-card",
						style: { padding: "20px" },
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "hub-icon",
							style: {
								width: 44,
								height: 44,
								color: "var(--primary-color)"
							},
							children: /* @__PURE__ */ _jsxDEV(User, { size: 24 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 441,
								columnNumber: 102
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 441,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("span", { children: "Profile" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 442,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 440,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "glass-panel hub-card",
						style: { padding: "20px" },
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "hub-icon",
							style: {
								width: 44,
								height: 44,
								color: "var(--primary-color)"
							},
							children: /* @__PURE__ */ _jsxDEV(Bell, { size: 24 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 445,
								columnNumber: 102
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 445,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("span", { children: "Notifications" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 446,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 444,
						columnNumber: 9
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 435,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("h3", {
				className: "section-title",
				children: "Personalization (Theme & Color)"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 450,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "ios-form-group",
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "ios-input-row",
						style: { display: "block" },
						children: [/* @__PURE__ */ _jsxDEV("label", {
							style: {
								display: "block",
								marginBottom: "12px"
							},
							children: "App Primary Color"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 454,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							style: {
								display: "flex",
								gap: "12px",
								flexWrap: "wrap"
							},
							children: predefinedColors.map((color, idx) => /* @__PURE__ */ _jsxDEV("div", {
								onClick: () => setPrimaryColor(color.value),
								style: {
									width: 36,
									height: 36,
									borderRadius: 18,
									background: color.value,
									cursor: "pointer",
									border: primaryColor === color.value ? "3px solid white" : "2px solid transparent",
									boxShadow: primaryColor === color.value ? "0 0 0 2px rgba(0,0,0,0.2)" : "0 2px 4px rgba(0,0,0,0.1)"
								},
								title: color.name
							}, idx, false, {
								fileName: _jsxFileName,
								lineNumber: 457,
								columnNumber: 15
							}, this))
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 455,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 453,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "ios-input-row",
						style: { display: "block" },
						children: [
							/* @__PURE__ */ _jsxDEV("label", {
								style: {
									display: "block",
									marginBottom: "12px"
								},
								children: "Background Image"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 472,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								style: {
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
									gap: "12px"
								},
								children: predefinedBackgrounds.map((bg, idx) => /* @__PURE__ */ _jsxDEV("div", {
									onClick: () => setBgImage(bg.value),
									style: {
										height: 80,
										borderRadius: 12,
										cursor: "pointer",
										backgroundImage: `url('${bg.value}')`,
										backgroundSize: "cover",
										backgroundPosition: "center",
										border: bgImage === bg.value ? "3px solid var(--primary-color)" : "2px solid transparent",
										boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
									},
									title: bg.name
								}, idx, false, {
									fileName: _jsxFileName,
									lineNumber: 475,
									columnNumber: 15
								}, this))
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 473,
								columnNumber: 11
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								style: { marginTop: "16px" },
								children: [/* @__PURE__ */ _jsxDEV("label", {
									style: {
										fontSize: "13px",
										display: "block",
										marginBottom: "6px"
									},
									children: "Custom Background URL"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 489,
									columnNumber: 13
								}, this), /* @__PURE__ */ _jsxDEV("input", {
									type: "text",
									value: bgImage,
									onChange: (e) => setBgImage(e.target.value),
									placeholder: "Paste image URL here...",
									style: {
										width: "100%",
										padding: "12px",
										borderRadius: "10px",
										background: "rgba(0,0,0,0.05)",
										textAlign: "left"
									}
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 490,
									columnNumber: 13
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 488,
								columnNumber: 11
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 471,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "ios-input-row",
						style: { display: "block" },
						children: [/* @__PURE__ */ _jsxDEV("label", {
							style: {
								display: "block",
								marginBottom: "12px"
							},
							children: "Card Opacity (Transparency)"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 501,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "12px"
							},
							children: [
								/* @__PURE__ */ _jsxDEV("span", {
									style: {
										fontSize: "13px",
										opacity: .6
									},
									children: "Transparent"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 503,
									columnNumber: 13
								}, this),
								/* @__PURE__ */ _jsxDEV("input", {
									type: "range",
									min: "0.1",
									max: "1",
									step: "0.05",
									value: glassOpacity,
									onChange: (e) => setGlassOpacity(parseFloat(e.target.value)),
									style: {
										flex: 1,
										accentColor: "var(--primary-color)",
										cursor: "pointer"
									}
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 504,
									columnNumber: 13
								}, this),
								/* @__PURE__ */ _jsxDEV("span", {
									style: {
										fontSize: "13px",
										opacity: .6
									},
									children: "Solid"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 513,
									columnNumber: 13
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 502,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 500,
						columnNumber: 9
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 451,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("h3", {
				className: "section-title",
				children: "Application Settings"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 518,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "ios-form-group",
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "ios-input-row",
						children: [/* @__PURE__ */ _jsxDEV("label", { children: "Dark Mode" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 521,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "switch-container",
							children: /* @__PURE__ */ _jsxDEV("div", { className: "ios-switch" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 523,
								columnNumber: 13
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 522,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 520,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "ios-input-row",
						children: [/* @__PURE__ */ _jsxDEV("label", { children: "Auto Sync" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 527,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "switch-container",
							children: /* @__PURE__ */ _jsxDEV("div", { className: "ios-switch on" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 529,
								columnNumber: 13
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 528,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 526,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "ios-input-row",
						children: [/* @__PURE__ */ _jsxDEV("label", { children: "Language" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 533,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("select", { children: [/* @__PURE__ */ _jsxDEV("option", { children: "English" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 535,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("option", { children: "Hindi" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 536,
							columnNumber: 13
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 534,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 532,
						columnNumber: 9
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 519,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 427,
		columnNumber: 5
	}, this);
};
_c7 = SettingsHub;
function App() {
	_s2();
	const [currentTab, setCurrentTab] = useState("dashboard");
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [primaryColor, setPrimaryColor] = useState("#007aff");
	const [bgImage, setBgImage] = useState("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2800&q=80");
	const [glassOpacity, setGlassOpacity] = useState(.55);
	React.useEffect(() => {
		document.documentElement.style.setProperty("--primary-color", primaryColor);
		document.documentElement.style.setProperty("--bg-image", `url('${bgImage}')`);
		document.documentElement.style.setProperty("--glass-bg", `rgba(255, 255, 255, ${glassOpacity})`);
		document.documentElement.style.setProperty("--glass-border", `rgba(255, 255, 255, ${Math.min(glassOpacity + .2, 1)})`);
	}, [
		primaryColor,
		bgImage,
		glassOpacity
	]);
	const changeTheme = (hue, tint) => {
		document.documentElement.style.setProperty("--bg-hue", hue);
		document.documentElement.style.setProperty("--bg-tint", tint);
	};
	const closeSidebar = () => setSidebarOpen(false);
	const handleNav = (tab) => {
		setCurrentTab(tab);
		closeSidebar();
	};
	const renderContent = () => {
		switch (currentTab) {
			case "dashboard": return /* @__PURE__ */ _jsxDEV(Dashboard, { setCurrentTab }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 571,
				columnNumber: 32
			}, this);
			case "sales":
			case "purchase":
			case "receipt":
			case "payment":
			case "journal":
			case "contra": return /* @__PURE__ */ _jsxDEV(CreateEntry, { type: currentTab }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 578,
				columnNumber: 16
			}, this);
			case "reports": return /* @__PURE__ */ _jsxDEV(ReportsHub, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 579,
				columnNumber: 30
			}, this);
			case "items": return /* @__PURE__ */ _jsxDEV(ItemsHub, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 580,
				columnNumber: 28
			}, this);
			case "parties": return /* @__PURE__ */ _jsxDEV(PartiesHub, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 581,
				columnNumber: 30
			}, this);
			case "outstanding": return /* @__PURE__ */ _jsxDEV(OutstandingHub, {}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 582,
				columnNumber: 34
			}, this);
			case "settings": return /* @__PURE__ */ _jsxDEV(SettingsHub, {
				primaryColor,
				setPrimaryColor,
				bgImage,
				setBgImage,
				glassOpacity,
				setGlassOpacity
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 583,
				columnNumber: 31
			}, this);
			default: return /* @__PURE__ */ _jsxDEV(Dashboard, { setCurrentTab }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 588,
				columnNumber: 23
			}, this);
		}
	};
	const navItems = [
		{
			id: "dashboard",
			name: "Dashboard",
			icon: /* @__PURE__ */ _jsxDEV(Home, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 593,
				columnNumber: 49
			}, this),
			color: "#007aff"
		},
		{
			id: "sales",
			name: "Sales",
			icon: /* @__PURE__ */ _jsxDEV(FileText, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 594,
				columnNumber: 41
			}, this),
			color: "#34c759"
		},
		{
			id: "purchase",
			name: "Purchase",
			icon: /* @__PURE__ */ _jsxDEV(ShoppingCart, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 595,
				columnNumber: 47
			}, this),
			color: "#ff9500"
		},
		{
			id: "receipt",
			name: "Receipt",
			icon: /* @__PURE__ */ _jsxDEV(ArrowDownRight, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 596,
				columnNumber: 45
			}, this),
			color: "#5856d6"
		},
		{
			id: "payment",
			name: "Payment",
			icon: /* @__PURE__ */ _jsxDEV(ArrowUpRight, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 597,
				columnNumber: 45
			}, this),
			color: "#ff2d55"
		},
		{
			id: "journal",
			name: "Journal",
			icon: /* @__PURE__ */ _jsxDEV(FileText, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 598,
				columnNumber: 45
			}, this),
			color: "#5ac8fa"
		},
		{
			id: "contra",
			name: "Contra",
			icon: /* @__PURE__ */ _jsxDEV(Landmark, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 599,
				columnNumber: 43
			}, this),
			color: "#ffcc00"
		},
		{
			id: "reports",
			name: "Reports",
			icon: /* @__PURE__ */ _jsxDEV(PieChart, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 600,
				columnNumber: 45
			}, this),
			color: "#ff9500"
		},
		{
			id: "items",
			name: "Items",
			icon: /* @__PURE__ */ _jsxDEV(Package, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 601,
				columnNumber: 41
			}, this),
			color: "#007aff"
		},
		{
			id: "parties",
			name: "Parties",
			icon: /* @__PURE__ */ _jsxDEV(Users, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 602,
				columnNumber: 45
			}, this),
			color: "#34c759"
		},
		{
			id: "outstanding",
			name: "Outstanding",
			icon: /* @__PURE__ */ _jsxDEV(FileSpreadsheet, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 603,
				columnNumber: 53
			}, this),
			color: "#ff3b30"
		},
		{
			id: "sales_team",
			name: "Sales Team",
			icon: /* @__PURE__ */ _jsxDEV(Briefcase, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 604,
				columnNumber: 51
			}, this),
			color: "#5856d6"
		},
		{
			id: "activity",
			name: "Activity",
			icon: /* @__PURE__ */ _jsxDEV(Activity, { size: 18 }, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 605,
				columnNumber: 47
			}, this),
			color: "#8e8e93"
		}
	];
	return /* @__PURE__ */ _jsxDEV("div", {
		className: "app-container",
		children: [
			/* @__PURE__ */ _jsxDEV("div", {
				className: `sidebar-overlay ${sidebarOpen ? "open" : ""}`,
				style: { display: sidebarOpen ? "block" : "none" },
				onClick: closeSidebar
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 612,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: `glass-panel glass-sidebar ${sidebarOpen ? "open" : ""}`,
				children: [
					/* @__PURE__ */ _jsxDEV("div", {
						className: "brand",
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: "brand-icon",
							children: /* @__PURE__ */ _jsxDEV(Grid, { size: 20 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 622,
								columnNumber: 13
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 621,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("h2", { children: "TallyConnect" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 624,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 620,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "nav-menu",
						children: navItems.map((item) => {
							const isActive = currentTab === item.id;
							return /* @__PURE__ */ _jsxDEV("div", {
								className: `nav-item ${isActive ? "active" : ""}`,
								onClick: () => handleNav(item.id),
								children: [/* @__PURE__ */ _jsxDEV("div", {
									className: "nav-icon-container",
									style: {
										backgroundColor: isActive ? "white" : item.color,
										color: isActive ? "var(--primary-color)" : "white",
										boxShadow: isActive ? "none" : `0 2px 6px ${item.color}40`
									},
									children: item.icon
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 636,
									columnNumber: 17
								}, this), /* @__PURE__ */ _jsxDEV("span", { children: item.name }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 646,
									columnNumber: 17
								}, this)]
							}, item.id, true, {
								fileName: _jsxFileName,
								lineNumber: 631,
								columnNumber: 15
							}, this);
						})
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 627,
						columnNumber: 9
					}, this),
					/* @__PURE__ */ _jsxDEV("div", {
						className: "nav-menu sidebar-bottom",
						children: [/* @__PURE__ */ _jsxDEV("div", {
							className: `nav-item ${currentTab === "settings" ? "active" : ""}`,
							onClick: () => handleNav("settings"),
							children: [/* @__PURE__ */ _jsxDEV("div", {
								className: "nav-icon-container",
								style: {
									backgroundColor: currentTab === "settings" ? "white" : "#8e8e93",
									color: currentTab === "settings" ? "var(--primary-color)" : "white",
									boxShadow: currentTab === "settings" ? "none" : `0 2px 6px #8e8e9340`
								},
								children: /* @__PURE__ */ _jsxDEV(Settings, { size: 18 }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 662,
									columnNumber: 15
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 654,
								columnNumber: 13
							}, this), /* @__PURE__ */ _jsxDEV("span", { children: "Settings" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 664,
								columnNumber: 13
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 653,
							columnNumber: 11
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "nav-item",
							style: { color: "var(--danger)" },
							children: [/* @__PURE__ */ _jsxDEV("div", {
								className: "nav-icon-container",
								style: {
									backgroundColor: "transparent",
									color: "var(--danger)",
									boxShadow: "none"
								},
								children: /* @__PURE__ */ _jsxDEV(LogOut, { size: 22 }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 668,
									columnNumber: 15
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 667,
								columnNumber: 13
							}, this), /* @__PURE__ */ _jsxDEV("span", { children: "Log Out" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 670,
								columnNumber: 13
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 666,
							columnNumber: 11
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 652,
						columnNumber: 9
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 619,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ _jsxDEV("div", {
				className: "main-wrapper",
				children: [/* @__PURE__ */ _jsxDEV("div", {
					className: "glass-header glass-panel",
					style: {
						borderRadius: "16px",
						background: "var(--glass-bg)",
						border: "none"
					},
					children: [/* @__PURE__ */ _jsxDEV("div", {
						className: "header-left",
						children: [/* @__PURE__ */ _jsxDEV("button", {
							className: "menu-toggle",
							onClick: () => setSidebarOpen(true),
							children: /* @__PURE__ */ _jsxDEV(Menu, { size: 24 }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 682,
								columnNumber: 15
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 681,
							columnNumber: 13
						}, this), /* @__PURE__ */ _jsxDEV("div", {
							className: "header-search",
							children: [/* @__PURE__ */ _jsxDEV(Search, {
								size: 18,
								color: "rgba(0,0,0,0.4)"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 685,
								columnNumber: 15
							}, this), /* @__PURE__ */ _jsxDEV("input", {
								type: "text",
								placeholder: "Search anything..."
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 686,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 684,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 680,
						columnNumber: 11
					}, this), /* @__PURE__ */ _jsxDEV("div", {
						className: "header-actions",
						style: { position: "relative" },
						children: [
							/* @__PURE__ */ _jsxDEV("div", {
								className: "icon-btn",
								title: "Quick Add",
								children: /* @__PURE__ */ _jsxDEV(Plus, { size: 20 }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 692,
									columnNumber: 15
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 691,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								className: "icon-btn",
								title: "Notifications",
								style: { position: "relative" },
								children: [/* @__PURE__ */ _jsxDEV(Bell, { size: 20 }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 695,
									columnNumber: 15
								}, this), /* @__PURE__ */ _jsxDEV("div", { style: {
									position: "absolute",
									top: 8,
									right: 8,
									width: 8,
									height: 8,
									background: "var(--danger)",
									borderRadius: 4,
									border: "2px solid white"
								} }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 696,
									columnNumber: 15
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 694,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", { style: {
								width: "1px",
								height: "24px",
								background: "rgba(0,0,0,0.1)",
								margin: "0 8px"
							} }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 698,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ _jsxDEV("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: "8px",
									cursor: "pointer",
									padding: "6px 12px",
									background: "rgba(0,0,0,0.05)",
									borderRadius: "20px",
									transition: "0.2s"
								},
								children: [
									/* @__PURE__ */ _jsxDEV("div", {
										style: {
											width: 28,
											height: 28,
											borderRadius: 14,
											background: "var(--primary-color)",
											color: "white",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: "13px",
											fontWeight: "bold"
										},
										children: "T"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 700,
										columnNumber: 15
									}, this),
									/* @__PURE__ */ _jsxDEV("span", {
										style: {
											fontSize: "14px",
											fontWeight: 600
										},
										children: "Tally User"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 703,
										columnNumber: 15
									}, this),
									/* @__PURE__ */ _jsxDEV(ChevronRight, {
										size: 16,
										color: "rgba(0,0,0,0.4)"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 704,
										columnNumber: 15
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 699,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 690,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 679,
					columnNumber: 9
				}, this), /* @__PURE__ */ _jsxDEV("div", {
					className: "content-scroll",
					children: renderContent()
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 710,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 676,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 609,
		columnNumber: 5
	}, this);
}
_s2(App, "vAmvHMfNiGBa9oIhZlASb20AsqA=");
_c8 = App;
export default App;
var _c, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
$RefreshReg$(_c, "Dashboard");
$RefreshReg$(_c2, "CreateEntry");
$RefreshReg$(_c3, "OutstandingHub");
$RefreshReg$(_c4, "ItemsHub");
$RefreshReg$(_c5, "PartiesHub");
$RefreshReg$(_c6, "ReportsHub");
$RefreshReg$(_c7, "SettingsHub");
$RefreshReg$(_c8, "App");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/App.jsx?t=1792128358422";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("D:/Prototype/tally-frontend/src/App.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("D:/Prototype/tally-frontend/src/App.jsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "D:/Prototype/tally-frontend/src/App.jsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,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QVE7Ozs7O09BQ25HLHdCQUFDLE9BQUQ7UUFBSyxPQUFPO1NBQUUsU0FBUztTQUFRLFlBQVk7U0FBVSxLQUFLO1NBQU8sUUFBUTtTQUFXLFNBQVM7U0FBWSxZQUFZO1NBQW9CLGNBQWM7U0FBUSxZQUFZO1FBQU87a0JBQWxMO1NBQ0Usd0JBQUMsT0FBRDtVQUFLLE9BQU87V0FBRSxPQUFPO1dBQUksUUFBUTtXQUFJLGNBQWM7V0FBSSxZQUFZO1dBQXdCLE9BQU87V0FBUyxTQUFTO1dBQVEsWUFBWTtXQUFVLGdCQUFnQjtXQUFVLFVBQVU7V0FBUSxZQUFZO1VBQU87b0JBQUc7U0FFL007Ozs7O1NBQ0wsd0JBQUMsUUFBRDtVQUFNLE9BQU87V0FBRSxVQUFVO1dBQVEsWUFBWTtVQUFJO29CQUFHO1NBQWdCOzs7OztTQUNwRSx3QkFBQyxjQUFEO1VBQWMsTUFBTTtVQUFJLE9BQU07U0FBbUI7Ozs7O1FBQzlDOzs7Ozs7TUFDRjs7Ozs7YUFDRjs7Ozs7Y0FHTCx3QkFBQyxPQUFEO0tBQUssV0FBVTtlQUNaLGNBQWM7SUFDWjs7OztZQUVGOzs7Ozs7RUFDRjs7Ozs7O0FBRVQ7OztBQUVBLGVBQWUiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiQXBwLmpzeCJdLCJ2ZXJzaW9uIjozLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XHJcbmltcG9ydCB7IFxyXG4gIE1lbnUsIFgsIEhvbWUsIFNob3BwaW5nQ2FydCwgQm94LCBBcnJvd0Rvd25SaWdodCwgQXJyb3dVcFJpZ2h0LFxyXG4gIEZpbGVUZXh0LCBDcmVkaXRDYXJkLCBQaWVDaGFydCwgUGFja2FnZSwgVXNlcnMsIEJyaWVmY2FzZSwgQWN0aXZpdHksXHJcbiAgU2V0dGluZ3MsIExvZ091dCwgU2VhcmNoLCBCZWxsLCBVc2VyLCBDaGVja0NpcmNsZTIsIFBhbGV0dGUsXHJcbiAgVHJlbmRpbmdVcCwgR3JpZCwgRmlsZVNwcmVhZHNoZWV0LCBMYW5kbWFyaywgRmlsdGVyLCBQbHVzLCBDaGV2cm9uUmlnaHRcclxufSBmcm9tICdsdWNpZGUtcmVhY3QnO1xyXG5pbXBvcnQgJy4vaW5kZXguY3NzJztcclxuXHJcbmNvbnN0IERhc2hib2FyZCA9ICh7IHNldEN1cnJlbnRUYWIgfSkgPT4ge1xyXG4gIGNvbnN0IGFjdGlvbnMgPSBbXHJcbiAgICB7IGlkOiAnc2FsZXMnLCBuYW1lOiAnQ3JlYXRlIFNhbGVzJywgaWNvbjogPEZpbGVUZXh0IC8+LCBjb2xvcjogJyNmZjNiMzAnIH0sXHJcbiAgICB7IGlkOiAncHVyY2hhc2UnLCBuYW1lOiAnQ3JlYXRlIFB1cmNoYXNlJywgaWNvbjogPFNob3BwaW5nQ2FydCAvPiwgY29sb3I6ICcjMDA3YWZmJyB9LFxyXG4gICAgeyBpZDogJ3JlY2VpcHQnLCBuYW1lOiAnUmVjZWlwdCcsIGljb246IDxBcnJvd0Rvd25SaWdodCAvPiwgY29sb3I6ICcjMzRjNzU5JyB9LFxyXG4gICAgeyBpZDogJ3BheW1lbnQnLCBuYW1lOiAnUGF5bWVudCcsIGljb246IDxBcnJvd1VwUmlnaHQgLz4sIGNvbG9yOiAnI2ZmOTUwMCcgfSxcclxuICAgIHsgaWQ6ICdqb3VybmFsJywgbmFtZTogJ0pvdXJuYWwnLCBpY29uOiA8RmlsZVRleHQgLz4sIGNvbG9yOiAnIzU4NTZkNicgfSxcclxuICAgIHsgaWQ6ICdjb250cmEnLCBuYW1lOiAnQ29udHJhJywgaWNvbjogPExhbmRtYXJrIC8+LCBjb2xvcjogJyNmZjJkNTUnIH0sXHJcbiAgXTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFkZS1pblwiPlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2UtaGVhZGVyXCI+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgIDxoMT5EYXNoYm9hcmQ8L2gxPlxyXG4gICAgICAgICAgPHA+WW91ciBidXNpbmVzcyBvdmVydmlldyBhdCBhIGdsYW5jZTwvcD5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9kaXY+XHJcblxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQtM1wiIHN0eWxlPXt7IG1hcmdpbkJvdHRvbTogJzMycHgnIH19PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ2xhc3MtcGFuZWwgc3VtbWFyeS1jYXJkXCI+XHJcbiAgICAgICAgICA8aDM+UmVjZWl2YWJsZTwvaDM+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFtb3VudFwiIHN0eWxlPXt7IGNvbG9yOiAndmFyKC0tc3VjY2VzcyknIH19PuKCuSA1LDIwLDAwMDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0cmVuZFwiIHN0eWxlPXt7IGNvbG9yOiAndmFyKC0tdGV4dC1tdXRlZCknIH19PjEyIHBlbmRpbmcgaW52b2ljZXM8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdsYXNzLXBhbmVsIHN1bW1hcnktY2FyZFwiPlxyXG4gICAgICAgICAgPGgzPlBheWFibGU8L2gzPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhbW91bnRcIiBzdHlsZT17eyBjb2xvcjogJ3ZhcigtLWRhbmdlciknIH19PuKCuSAzLDgwLDAwMDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0cmVuZFwiIHN0eWxlPXt7IGNvbG9yOiAndmFyKC0tdGV4dC1tdXRlZCknIH19PjUgdXBjb21pbmcgZHVlczwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ2xhc3MtcGFuZWwgc3VtbWFyeS1jYXJkXCI+XHJcbiAgICAgICAgICA8aDM+Q2FzaCAmIEJhbms8L2gzPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhbW91bnRcIj7igrkgMTQsNTAsMDAwPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRyZW5kXCI+XHJcbiAgICAgICAgICAgIDxUcmVuZGluZ1VwIHNpemU9ezE2fSBjb2xvcj1cInZhcigtLXN1Y2Nlc3MpXCIgLz4gPHNwYW4gc3R5bGU9e3sgY29sb3I6ICd2YXIoLS1zdWNjZXNzKScgfX0+VXAgMi40JSB0b2RheTwvc3Bhbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxoMiBjbGFzc05hbWU9XCJzZWN0aW9uLXRpdGxlXCI+UXVpY2sgQWN0aW9uczwvaDI+XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZC02XCIgc3R5bGU9e3sgbWFyZ2luQm90dG9tOiAnMzJweCcgfX0+XHJcbiAgICAgICAge2FjdGlvbnMubWFwKChhY3Rpb24pID0+IChcclxuICAgICAgICAgIDxkaXYgXHJcbiAgICAgICAgICAgIGtleT17YWN0aW9uLmlkfSBcclxuICAgICAgICAgICAgY2xhc3NOYW1lPVwiZ2xhc3MtcGFuZWwgaHViLWNhcmRcIlxyXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRDdXJyZW50VGFiKGFjdGlvbi5pZCl9XHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaHViLWljb25cIiBzdHlsZT17eyBjb2xvcjogYWN0aW9uLmNvbG9yIH19PlxyXG4gICAgICAgICAgICAgIHtSZWFjdC5jbG9uZUVsZW1lbnQoYWN0aW9uLmljb24sIHsgc2l6ZTogMjggfSl9XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8c3Bhbj57YWN0aW9uLm5hbWV9PC9zcGFuPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKSl9XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgPGgyIGNsYXNzTmFtZT1cInNlY3Rpb24tdGl0bGVcIj5SZWNlbnQgQWN0aXZpdHk8L2gyPlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImlvcy1saXN0XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsaXN0LWl0ZW1cIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC1sZWZ0XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC1pY29uXCIgc3R5bGU9e3sgY29sb3I6ICcjZmYzYjMwJyB9fT5cclxuICAgICAgICAgICAgICA8RmlsZVRleHQgc2l6ZT17MjB9IC8+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtdGV4dFwiPlxyXG4gICAgICAgICAgICAgIDxoND5SYW1lc2ggVHJhZGVyczwvaDQ+XHJcbiAgICAgICAgICAgICAgPHA+U2FsZXMgVm91Y2hlciDigKIgVG9kYXksIDEwOjQ1IEFNPC9wPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsaXN0LXJpZ2h0XCI+XHJcbiAgICAgICAgICAgIDxoND7igrkgMTIsNTAwPC9oND5cclxuICAgICAgICAgICAgPHAgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS1zdWNjZXNzKScsIGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzRweCcsIGp1c3RpZnlDb250ZW50OiAnZmxleC1lbmQnIH19PjxDaGVja0NpcmNsZTIgc2l6ZT17MTR9IC8+IERvbmU8L3A+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtaXRlbVwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsaXN0LWxlZnRcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsaXN0LWljb25cIiBzdHlsZT17eyBjb2xvcjogJyMzNGM3NTknIH19PlxyXG4gICAgICAgICAgICAgIDxBcnJvd0Rvd25SaWdodCBzaXplPXsyMH0gLz5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC10ZXh0XCI+XHJcbiAgICAgICAgICAgICAgPGg0Pk5laGEgU2hhcm1hPC9oND5cclxuICAgICAgICAgICAgICA8cD5SZWNlaXB0IOKAoiBZZXN0ZXJkYXksIDI6MTUgUE08L3A+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtcmlnaHRcIj5cclxuICAgICAgICAgICAgPGg0PuKCuSA1LDAwMDwvaDQ+XHJcbiAgICAgICAgICAgIDxwIHN0eWxlPXt7IGNvbG9yOiAndmFyKC0tc3VjY2VzcyknLCBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc0cHgnLCBqdXN0aWZ5Q29udGVudDogJ2ZsZXgtZW5kJyB9fT48Q2hlY2tDaXJjbGUyIHNpemU9ezE0fSAvPiBEb25lPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufTtcclxuXHJcbmNvbnN0IENyZWF0ZUVudHJ5ID0gKHsgdHlwZSB9KSA9PiB7XHJcbiAgY29uc3QgW2l0ZW1zLCBzZXRJdGVtc10gPSB1c2VTdGF0ZShbeyBuYW1lOiAnJywgcXR5OiAxLCByYXRlOiAwLCBhbW91bnQ6IDAgfV0pO1xyXG4gIFxyXG4gIGNvbnN0IGhhbmRsZUl0ZW1DaGFuZ2UgPSAoaW5kZXgsIGZpZWxkLCB2YWx1ZSkgPT4ge1xyXG4gICAgY29uc3QgbmV3SXRlbXMgPSBbLi4uaXRlbXNdO1xyXG4gICAgbmV3SXRlbXNbaW5kZXhdW2ZpZWxkXSA9IHZhbHVlO1xyXG4gICAgaWYgKGZpZWxkID09PSAncXR5JyB8fCBmaWVsZCA9PT0gJ3JhdGUnKSB7XHJcbiAgICAgIG5ld0l0ZW1zW2luZGV4XS5hbW91bnQgPSBuZXdJdGVtc1tpbmRleF0ucXR5ICogbmV3SXRlbXNbaW5kZXhdLnJhdGU7XHJcbiAgICB9XHJcbiAgICBzZXRJdGVtcyhuZXdJdGVtcyk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgYWRkSXRlbSA9ICgpID0+IHNldEl0ZW1zKFsuLi5pdGVtcywgeyBuYW1lOiAnJywgcXR5OiAxLCByYXRlOiAwLCBhbW91bnQ6IDAgfV0pO1xyXG4gIGNvbnN0IHRvdGFsQW1vdW50ID0gaXRlbXMucmVkdWNlKChzdW0sIGl0ZW0pID0+IHN1bSArIGl0ZW0uYW1vdW50LCAwKTtcclxuXHJcbiAgY29uc3QgdGl0bGUgPSB0eXBlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdHlwZS5zbGljZSgxKSArICcgRW50cnknO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmYWRlLWluXCI+XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnZS1oZWFkZXJcIj5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgPGgxPnt0aXRsZX08L2gxPlxyXG4gICAgICAgICAgPHA+Q3JlYXRlIGEgbmV3IHRyYW5zYWN0aW9uIHJlY29yZDwvcD5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0bi1wcmltYXJ5XCI+XHJcbiAgICAgICAgICBTYXZlIEVudHJ5XHJcbiAgICAgICAgPC9idXR0b24+XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb3JtLWNvbnRhaW5lclwiPlxyXG4gICAgICAgIDxoMyBjbGFzc05hbWU9XCJzZWN0aW9uLXRpdGxlXCIgc3R5bGU9e3sgbWFyZ2luVG9wOiAwIH19PkJhc2ljIERldGFpbHM8L2gzPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLWZvcm0tZ3JvdXBcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLWlucHV0LXJvd1wiPlxyXG4gICAgICAgICAgICA8bGFiZWw+RGF0ZTwvbGFiZWw+XHJcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiZGF0ZVwiIGRlZmF1bHRWYWx1ZT17bmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF19IC8+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLWlucHV0LXJvd1wiPlxyXG4gICAgICAgICAgICA8bGFiZWw+Vm91Y2hlciBObzwvbGFiZWw+XHJcbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIHZhbHVlPXtgJHt0eXBlLnN1YnN0cmluZygwLDMpLnRvVXBwZXJDYXNlKCl9LTEwMjRgfSByZWFkT25seSBzdHlsZT17eyBjb2xvcjogJ3JnYmEoMCwwLDAsMC40KScgfX0gLz5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICA8aDMgY2xhc3NOYW1lPVwic2VjdGlvbi10aXRsZVwiPlBhcnR5IERldGFpbHM8L2gzPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLWZvcm0tZ3JvdXBcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLWlucHV0LXJvd1wiPlxyXG4gICAgICAgICAgICA8bGFiZWw+UGFydHkgQS9jPC9sYWJlbD5cclxuICAgICAgICAgICAgPHNlbGVjdD5cclxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiXCI+U2VsZWN0IFBhcnR5Li4uPC9vcHRpb24+XHJcbiAgICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIjFcIj5SYW1lc2ggVHJhZGVyczwvb3B0aW9uPlxyXG4gICAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9XCIyXCI+TmVoYSBTaGFybWE8L29wdGlvbj5cclxuICAgICAgICAgICAgICA8b3B0aW9uIHZhbHVlPVwiM1wiPkNhc2g8L29wdGlvbj5cclxuICAgICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLWlucHV0LXJvd1wiPlxyXG4gICAgICAgICAgICA8bGFiZWw+TGVkZ2VyPC9sYWJlbD5cclxuICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgZGVmYXVsdFZhbHVlPXtgTG9jYWwgJHt0eXBlLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgdHlwZS5zbGljZSgxKX1gfSAvPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIDxoMyBjbGFzc05hbWU9XCJzZWN0aW9uLXRpdGxlXCI+SXRlbXM8L2gzPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLWZvcm0tZ3JvdXBcIiBzdHlsZT17eyBwYWRkaW5nOiAnMTZweCAyMHB4JyB9fT5cclxuICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2dyaWQnLCBncmlkVGVtcGxhdGVDb2x1bW5zOiAnMmZyIDFmciAxZnIgMWZyJywgZ2FwOiAnOHB4JywgbWFyZ2luQm90dG9tOiAnOHB4JywgZm9udFNpemU6ICcxM3B4JywgY29sb3I6ICdyZ2JhKDAsMCwwLDAuNSknLCBmb250V2VpZ2h0OiAnNjAwJyB9fT5cclxuICAgICAgICAgICAgPGRpdj5JdGVtPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgdGV4dEFsaWduOiAncmlnaHQnIH19PlF0eTwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IHRleHRBbGlnbjogJ3JpZ2h0JyB9fT5SYXRlPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgdGV4dEFsaWduOiAncmlnaHQnIH19PkFtb3VudDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIHtpdGVtcy5tYXAoKGl0ZW0sIGluZGV4KSA9PiAoXHJcbiAgICAgICAgICAgIDxkaXYga2V5PXtpbmRleH0gc3R5bGU9e3sgZGlzcGxheTogJ2dyaWQnLCBncmlkVGVtcGxhdGVDb2x1bW5zOiAnMmZyIDFmciAxZnIgMWZyJywgZ2FwOiAnOHB4JywgbWFyZ2luQm90dG9tOiAnMTZweCcsIGFsaWduSXRlbXM6ICdjZW50ZXInIH19PlxyXG4gICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBwbGFjZWhvbGRlcj1cIk5hbWVcIiB2YWx1ZT17aXRlbS5uYW1lfSBvbkNoYW5nZT17KGUpID0+IGhhbmRsZUl0ZW1DaGFuZ2UoaW5kZXgsICduYW1lJywgZS50YXJnZXQudmFsdWUpfSBzdHlsZT17eyB3aWR0aDogJzEwMCUnLCBwYWRkaW5nOiAnMTBweCcsIGJvcmRlclJhZGl1czogJzhweCcsIGJvcmRlcjogJ25vbmUnLCBiYWNrZ3JvdW5kOiAncmdiYSgwLDAsMCwwLjA1KScsIGZvbnRTaXplOiAnMTVweCcsIGZvbnRXZWlnaHQ6IDYwMCB9fSAvPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cIm51bWJlclwiIHBsYWNlaG9sZGVyPVwiUXR5XCIgdmFsdWU9e2l0ZW0ucXR5fSBvbkNoYW5nZT17KGUpID0+IGhhbmRsZUl0ZW1DaGFuZ2UoaW5kZXgsICdxdHknLCBOdW1iZXIoZS50YXJnZXQudmFsdWUpKX0gc3R5bGU9e3sgd2lkdGg6ICcxMDAlJywgcGFkZGluZzogJzEwcHgnLCBib3JkZXJSYWRpdXM6ICc4cHgnLCBib3JkZXI6ICdub25lJywgYmFja2dyb3VuZDogJ3JnYmEoMCwwLDAsMC4wNSknLCBmb250U2l6ZTogJzE1cHgnLCB0ZXh0QWxpZ246ICdyaWdodCcsIGZvbnRXZWlnaHQ6IDYwMCB9fSAvPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICA8aW5wdXQgdHlwZT1cIm51bWJlclwiIHBsYWNlaG9sZGVyPVwiUmF0ZVwiIHZhbHVlPXtpdGVtLnJhdGV9IG9uQ2hhbmdlPXsoZSkgPT4gaGFuZGxlSXRlbUNoYW5nZShpbmRleCwgJ3JhdGUnLCBOdW1iZXIoZS50YXJnZXQudmFsdWUpKX0gc3R5bGU9e3sgd2lkdGg6ICcxMDAlJywgcGFkZGluZzogJzEwcHgnLCBib3JkZXJSYWRpdXM6ICc4cHgnLCBib3JkZXI6ICdub25lJywgYmFja2dyb3VuZDogJ3JnYmEoMCwwLDAsMC4wNSknLCBmb250U2l6ZTogJzE1cHgnLCB0ZXh0QWxpZ246ICdyaWdodCcsIGZvbnRXZWlnaHQ6IDYwMCB9fSAvPlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgdGV4dEFsaWduOiAncmlnaHQnLCBmb250U2l6ZTogJzE2cHgnLCBmb250V2VpZ2h0OiAnNzAwJyB9fT5cclxuICAgICAgICAgICAgICAgIOKCuSB7aXRlbS5hbW91bnQudG9GaXhlZCgyKX1cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICApKX1cclxuXHJcbiAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9e2FkZEl0ZW19IHN0eWxlPXt7IGJhY2tncm91bmQ6ICd0cmFuc3BhcmVudCcsIGJvcmRlcjogJ25vbmUnLCBjb2xvcjogJ3ZhcigtLXByaW1hcnktY29sb3IpJywgZm9udFNpemU6ICcxNXB4JywgZm9udFdlaWdodDogJzYwMCcsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnOHB4IDAnLCBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBnYXA6ICc0cHgnIH19PlxyXG4gICAgICAgICAgICA8UGx1cyBzaXplPXsxNn0gLz4gQWRkIEl0ZW1cclxuICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImlvcy1mb3JtLWdyb3VwXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImlvcy1pbnB1dC1yb3dcIiBzdHlsZT17eyBib3JkZXI6ICdub25lJywgcGFkZGluZ1RvcDogJzI0cHgnLCBwYWRkaW5nQm90dG9tOiAnMjRweCcgfX0+XHJcbiAgICAgICAgICAgIDxsYWJlbCBzdHlsZT17eyBmb250U2l6ZTogJzIwcHgnIH19PlRvdGFsIEFtb3VudDwvbGFiZWw+XHJcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZmxleDogMSwgdGV4dEFsaWduOiAncmlnaHQnLCBmb250U2l6ZTogJzMycHgnLCBmb250V2VpZ2h0OiAnNzAwJywgY29sb3I6ICd2YXIoLS10ZXh0LWRhcmspJyB9fT5cclxuICAgICAgICAgICAgICDigrkge3RvdGFsQW1vdW50LnRvRml4ZWQoMil9XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufTtcclxuXHJcbmNvbnN0IE91dHN0YW5kaW5nSHViID0gKCkgPT4ge1xyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZhZGUtaW5cIj5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdlLWhlYWRlclwiPlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICA8aDE+T3V0c3RhbmRpbmc8L2gxPlxyXG4gICAgICAgICAgPHA+VHJhY2sgeW91ciByZWNlaXZhYmxlcyBhbmQgcGF5YWJsZXM8L3A+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICBcclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkLTJcIiBzdHlsZT17eyBtYXJnaW5Cb3R0b206ICczMnB4JyB9fT5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdsYXNzLXBhbmVsIHN1bW1hcnktY2FyZFwiIHN0eWxlPXt7IGFsaWduSXRlbXM6ICdjZW50ZXInIH19PlxyXG4gICAgICAgICAgPGgzPlRvdGFsIFJlY2VpdmFibGUgKE1vbmV5IHRvIHJlY2VpdmUpPC9oMz5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYW1vdW50XCIgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS1zdWNjZXNzKScgfX0+4oK5IDUsMjAsMDAwPC9kaXY+XHJcbiAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0bi1wcmltYXJ5XCIgc3R5bGU9e3sgbWFyZ2luVG9wOiAnMTZweCcsIHdpZHRoOiAnMTAwJScgfX0+VmlldyBSZWNlaXZhYmxlPC9idXR0b24+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJnbGFzcy1wYW5lbCBzdW1tYXJ5LWNhcmRcIiBzdHlsZT17eyBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cclxuICAgICAgICAgIDxoMz5Ub3RhbCBQYXlhYmxlIChNb25leSB0byBwYXkpPC9oMz5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYW1vdW50XCIgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS1kYW5nZXIpJyB9fT7igrkgMyw4MCwwMDA8L2Rpdj5cclxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiYnRuLXByaW1hcnlcIiBzdHlsZT17eyBtYXJnaW5Ub3A6ICcxNnB4Jywgd2lkdGg6ICcxMDAlJywgYmFja2dyb3VuZDogJ3ZhcigtLWRhbmdlciknIH19PlZpZXcgUGF5YWJsZTwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxoMiBjbGFzc05hbWU9XCJzZWN0aW9uLXRpdGxlXCI+VG9wIE92ZXJkdWU8L2gyPlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImlvcy1saXN0XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsaXN0LWl0ZW1cIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC1sZWZ0XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC10ZXh0XCI+XHJcbiAgICAgICAgICAgICAgPGg0PlN1cGVyIFdob2xlc2FsZXJzPC9oND5cclxuICAgICAgICAgICAgICA8cD5JbnZvaWNlICMxMDQyIOKAoiA1IGRheXMgb3ZlcmR1ZTwvcD5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC1yaWdodFwiPlxyXG4gICAgICAgICAgICA8aDQgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS1kYW5nZXIpJyB9fT7igrkgNDUsMDAwPC9oND5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPENoZXZyb25SaWdodCBzaXplPXsyMH0gY29sb3I9XCJyZ2JhKDAsMCwwLDAuMylcIiAvPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC1pdGVtXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtbGVmdFwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtdGV4dFwiPlxyXG4gICAgICAgICAgICAgIDxoND5DaXR5IERpc3RyaWJ1dG9yczwvaDQ+XHJcbiAgICAgICAgICAgICAgPHA+SW52b2ljZSAjMTA1NSDigKIgRHVlIGluIDIgZGF5czwvcD5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC1yaWdodFwiPlxyXG4gICAgICAgICAgICA8aDQgc3R5bGU9e3sgY29sb3I6ICd2YXIoLS10ZXh0LWRhcmspJyB9fT7igrkgMTIsNTAwPC9oND5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPENoZXZyb25SaWdodCBzaXplPXsyMH0gY29sb3I9XCJyZ2JhKDAsMCwwLDAuMylcIiAvPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn07XHJcblxyXG5jb25zdCBJdGVtc0h1YiA9ICgpID0+IHtcclxuICByZXR1cm4gKFxyXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmYWRlLWluXCI+XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnZS1oZWFkZXJcIj5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgPGgxPkl0ZW1zPC9oMT5cclxuICAgICAgICAgIDxwPk1hbmFnZSB5b3VyIGludmVudG9yeSBhbmQgc3RvY2s8L3A+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJidG4tcHJpbWFyeVwiPjxQbHVzIHNpemU9ezE4fSAvPiBBZGQgSXRlbTwvYnV0dG9uPlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBnYXA6ICcxMnB4JywgbWFyZ2luQm90dG9tOiAnMjRweCcgfX0+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoZWFkZXItc2VhcmNoXCIgc3R5bGU9e3sgd2lkdGg6ICcxMDAlJywgbWF4V2lkdGg6ICc0MDBweCcsIGJhY2tncm91bmQ6ICdyZ2JhKDI1NSwyNTUsMjU1LDAuNiknIH19PlxyXG4gICAgICAgICAgPFNlYXJjaCBzaXplPXsxOH0gY29sb3I9XCJyZ2JhKDAsMCwwLDAuNClcIiAvPlxyXG4gICAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgcGxhY2Vob2xkZXI9XCJTZWFyY2ggSXRlbXMuLi5cIiAvPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiaWNvbi1idG5cIiBzdHlsZT17eyBiYWNrZ3JvdW5kOiAncmdiYSgyNTUsMjU1LDI1NSwwLjYpJyB9fT48RmlsdGVyIHNpemU9ezE4fSAvPjwvYnV0dG9uPlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLXRhYmxlLWNvbnRhaW5lclwiPlxyXG4gICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJpb3MtdGFibGVcIj5cclxuICAgICAgICAgIDx0aGVhZD5cclxuICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgIDx0aD5JdGVtIE5hbWU8L3RoPlxyXG4gICAgICAgICAgICAgIDx0aD5DYXRlZ29yeTwvdGg+XHJcbiAgICAgICAgICAgICAgPHRoPlN0b2NrPC90aD5cclxuICAgICAgICAgICAgICA8dGg+UmF0ZTwvdGg+XHJcbiAgICAgICAgICAgICAgPHRoPlN0YXR1czwvdGg+XHJcbiAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICA8L3RoZWFkPlxyXG4gICAgICAgICAgPHRib2R5PlxyXG4gICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgPHRkPlByZW1pdW0gTm90ZWJvb2s8L3RkPlxyXG4gICAgICAgICAgICAgIDx0ZD5TdGF0aW9uZXJ5PC90ZD5cclxuICAgICAgICAgICAgICA8dGQ+MTIwIFBjczwvdGQ+XHJcbiAgICAgICAgICAgICAgPHRkPuKCuSA1MC4wMDwvdGQ+XHJcbiAgICAgICAgICAgICAgPHRkPjxzcGFuIGNsYXNzTmFtZT1cImJhZGdlIGJhZGdlLXN1Y2Nlc3NcIj5JbiBTdG9jazwvc3Bhbj48L3RkPlxyXG4gICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgPHRkPkJsdWUgSW5rIFBlbjwvdGQ+XHJcbiAgICAgICAgICAgICAgPHRkPlN0YXRpb25lcnk8L3RkPlxyXG4gICAgICAgICAgICAgIDx0ZD41IFBjczwvdGQ+XHJcbiAgICAgICAgICAgICAgPHRkPuKCuSAxMC4wMDwvdGQ+XHJcbiAgICAgICAgICAgICAgPHRkPjxzcGFuIGNsYXNzTmFtZT1cImJhZGdlIGJhZGdlLXdhcm5pbmdcIj5Mb3cgU3RvY2s8L3NwYW4+PC90ZD5cclxuICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgIDx0ZD5PZmZpY2UgQ2hhaXI8L3RkPlxyXG4gICAgICAgICAgICAgIDx0ZD5GdXJuaXR1cmU8L3RkPlxyXG4gICAgICAgICAgICAgIDx0ZD4yNSBQY3M8L3RkPlxyXG4gICAgICAgICAgICAgIDx0ZD7igrkgNCw1MDAuMDA8L3RkPlxyXG4gICAgICAgICAgICAgIDx0ZD48c3BhbiBjbGFzc05hbWU9XCJiYWRnZSBiYWRnZS1zdWNjZXNzXCI+SW4gU3RvY2s8L3NwYW4+PC90ZD5cclxuICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgPC90YWJsZT5cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59O1xyXG5cclxuY29uc3QgUGFydGllc0h1YiA9ICgpID0+IHtcclxuICByZXR1cm4gKFxyXG4gICAgPGRpdiBjbGFzc05hbWU9XCJmYWRlLWluXCI+XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicGFnZS1oZWFkZXJcIj5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgPGgxPlBhcnRpZXM8L2gxPlxyXG4gICAgICAgICAgPHA+Q3VzdG9tZXJzLCBTdXBwbGllcnMgJiBBbGwgUGFydGllczwvcD5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cImJ0bi1wcmltYXJ5XCI+PFBsdXMgc2l6ZT17MTh9IC8+IEFkZCBQYXJ0eTwvYnV0dG9uPlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZC0zXCIgc3R5bGU9e3sgbWFyZ2luQm90dG9tOiAnMjRweCcgfX0+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJnbGFzcy1wYW5lbCBodWItY2FyZFwiIHN0eWxlPXt7IHBhZGRpbmc6ICcxNnB4JywgZmxleERpcmVjdGlvbjogJ3JvdycsIGp1c3RpZnlDb250ZW50OiAnZmxleC1zdGFydCcgfX0+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImh1Yi1pY29uXCIgc3R5bGU9e3sgd2lkdGg6IDQwLCBoZWlnaHQ6IDQwLCBjb2xvcjogJ3ZhcigtLXN1Y2Nlc3MpJyB9fT48VXNlcnMgc2l6ZT17MjB9IC8+PC9kaXY+XHJcbiAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzE2cHgnIH19PkN1c3RvbWVyczwvc3Bhbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdsYXNzLXBhbmVsIGh1Yi1jYXJkXCIgc3R5bGU9e3sgcGFkZGluZzogJzE2cHgnLCBmbGV4RGlyZWN0aW9uOiAncm93JywganVzdGlmeUNvbnRlbnQ6ICdmbGV4LXN0YXJ0JyB9fT5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaHViLWljb25cIiBzdHlsZT17eyB3aWR0aDogNDAsIGhlaWdodDogNDAsIGNvbG9yOiAndmFyKC0tZGFuZ2VyKScgfX0+PEJyaWVmY2FzZSBzaXplPXsyMH0gLz48L2Rpdj5cclxuICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAnMTZweCcgfX0+U3VwcGxpZXJzPC9zcGFuPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ2xhc3MtcGFuZWwgaHViLWNhcmRcIiBzdHlsZT17eyBwYWRkaW5nOiAnMTZweCcsIGZsZXhEaXJlY3Rpb246ICdyb3cnLCBqdXN0aWZ5Q29udGVudDogJ2ZsZXgtc3RhcnQnLCBiYWNrZ3JvdW5kOiAncmdiYSgyNTUsMjU1LDI1NSwwLjcpJyB9fT5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaHViLWljb25cIiBzdHlsZT17eyB3aWR0aDogNDAsIGhlaWdodDogNDAsIGNvbG9yOiAndmFyKC0tcHJpbWFyeS1jb2xvciknIH19PjxVc2VycyBzaXplPXsyMH0gLz48L2Rpdj5cclxuICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAnMTZweCcgfX0+QWxsIFBhcnRpZXM8L3NwYW4+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJpb3MtbGlzdFwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC1pdGVtXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtbGVmdFwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtaWNvblwiIHN0eWxlPXt7IGJhY2tncm91bmQ6ICd2YXIoLS1wcmltYXJ5LWNvbG9yKScsIGNvbG9yOiAnd2hpdGUnIH19PlI8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsaXN0LXRleHRcIj5cclxuICAgICAgICAgICAgICA8aDQ+UmFtZXNoIFRyYWRlcnM8L2g0PlxyXG4gICAgICAgICAgICAgIDxwPis5MSA5ODc2NSA0MzIxMCDigKIgQ3VzdG9tZXI8L3A+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtcmlnaHRcIj5cclxuICAgICAgICAgICAgPGg0IHN0eWxlPXt7IGNvbG9yOiAndmFyKC0tc3VjY2VzcyknIH19PuKCuSAxMiw1MDA8L2g0PlxyXG4gICAgICAgICAgICA8cD5SZWNlaXZhYmxlPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsaXN0LWl0ZW1cIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC1sZWZ0XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC1pY29uXCIgc3R5bGU9e3sgYmFja2dyb3VuZDogJ3ZhcigtLWRhbmdlciknLCBjb2xvcjogJ3doaXRlJyB9fT5TPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibGlzdC10ZXh0XCI+XHJcbiAgICAgICAgICAgICAgPGg0PlN1cGVyIFdob2xlc2FsZXJzPC9oND5cclxuICAgICAgICAgICAgICA8cD4rOTEgOTk4ODcgNzY2NTUg4oCiIFN1cHBsaWVyPC9wPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJsaXN0LXJpZ2h0XCI+XHJcbiAgICAgICAgICAgIDxoNCBzdHlsZT17eyBjb2xvcjogJ3ZhcigtLWRhbmdlciknIH19PuKCuSA0NSwwMDA8L2g0PlxyXG4gICAgICAgICAgICA8cD5QYXlhYmxlPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufTtcclxuXHJcbmNvbnN0IFJlcG9ydHNIdWIgPSAoKSA9PiB7XHJcbiAgY29uc3QgcmVwb3J0cyA9IFtcclxuICAgIHsgbmFtZTogJ1NhbGVzIFJlcG9ydHMnLCBpY29uOiA8VHJlbmRpbmdVcCAvPiwgY29sb3I6ICcjZmYzYjMwJyB9LFxyXG4gICAgeyBuYW1lOiAnUHVyY2hhc2UgUmVwb3J0cycsIGljb246IDxTaG9wcGluZ0NhcnQgLz4sIGNvbG9yOiAnIzAwN2FmZicgfSxcclxuICAgIHsgbmFtZTogJ1BheW1lbnQgUmVwb3J0cycsIGljb246IDxDcmVkaXRDYXJkIC8+LCBjb2xvcjogJyNmZjk1MDAnIH0sXHJcbiAgICB7IG5hbWU6ICdPdXRzdGFuZGluZyBSZXBvcnRzJywgaWNvbjogPEZpbGVTcHJlYWRzaGVldCAvPiwgY29sb3I6ICcjNTg1NmQ2JyB9LFxyXG4gICAgeyBuYW1lOiAnU3RvY2sgUmVwb3J0cycsIGljb246IDxQYWNrYWdlIC8+LCBjb2xvcjogJyMzNGM3NTknIH0sXHJcbiAgICB7IG5hbWU6ICdCdXNpbmVzcyBSZXBvcnRzJywgaWNvbjogPFBpZUNoYXJ0IC8+LCBjb2xvcjogJyNhZjUyZGUnIH0sXHJcbiAgICB7IG5hbWU6ICdBY2NvdW50aW5nIFJlcG9ydHMnLCBpY29uOiA8RmlsZVRleHQgLz4sIGNvbG9yOiAnI2ZmMmQ1NScgfSxcclxuICBdO1xyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImZhZGUtaW5cIj5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJwYWdlLWhlYWRlclwiPlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICA8aDE+UmVwb3J0czwvaDE+XHJcbiAgICAgICAgICA8cD5EZXRhaWxlZCBpbnNpZ2h0cyBpbnRvIHlvdXIgYnVzaW5lc3M8L3A+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQtNFwiPlxyXG4gICAgICAgIHtyZXBvcnRzLm1hcCgociwgaSkgPT4gKFxyXG4gICAgICAgICAgPGRpdiBrZXk9e2l9IGNsYXNzTmFtZT1cImdsYXNzLXBhbmVsIGh1Yi1jYXJkXCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaHViLWljb25cIiBzdHlsZT17eyBjb2xvcjogci5jb2xvciB9fT5cclxuICAgICAgICAgICAgICB7UmVhY3QuY2xvbmVFbGVtZW50KHIuaWNvbiwgeyBzaXplOiAyOCB9KX1cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxzcGFuPntyLm5hbWV9PC9zcGFuPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKSl9XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufTtcclxuXHJcbmNvbnN0IFNldHRpbmdzSHViID0gKHsgcHJpbWFyeUNvbG9yLCBzZXRQcmltYXJ5Q29sb3IsIGJnSW1hZ2UsIHNldEJnSW1hZ2UsIGdsYXNzT3BhY2l0eSwgc2V0R2xhc3NPcGFjaXR5IH0pID0+IHtcclxuICBjb25zdCBwcmVkZWZpbmVkQ29sb3JzID0gW1xyXG4gICAgeyBuYW1lOiAnaU9TIEJsdWUnLCB2YWx1ZTogJyMwMDdhZmYnIH0sXHJcbiAgICB7IG5hbWU6ICdUYWxseSBHcmVlbicsIHZhbHVlOiAnIzM0Yzc1OScgfSxcclxuICAgIHsgbmFtZTogJ1N1bnNldCBPcmFuZ2UnLCB2YWx1ZTogJyNmZjk1MDAnIH0sXHJcbiAgICB7IG5hbWU6ICdEZWVwIFB1cnBsZScsIHZhbHVlOiAnIzU4NTZkNicgfSxcclxuICAgIHsgbmFtZTogJ1Jvc2UgUmVkJywgdmFsdWU6ICcjZmYyZDU1JyB9LFxyXG4gICAgeyBuYW1lOiAnTWlkbmlnaHQgRGFyaycsIHZhbHVlOiAnIzFjMWMxZScgfSxcclxuICBdO1xyXG5cclxuICBjb25zdCBwcmVkZWZpbmVkQmFja2dyb3VuZHMgPSBbXHJcbiAgICB7IG5hbWU6ICdCZWFjaCBTdW5yaXNlJywgdmFsdWU6ICdodHRwczovL2ltYWdlcy51bnNwbGFzaC5jb20vcGhvdG8tMTUwNzUyNTQyODAzNC1iNzIzY2Y5NjFkM2U/YXV0bz1mb3JtYXQmZml0PWNyb3Amdz0yODAwJnE9ODAnIH0sXHJcbiAgICB7IG5hbWU6ICdNb3VudGFpbiBMYWtlJywgdmFsdWU6ICdodHRwczovL2ltYWdlcy51bnNwbGFzaC5jb20vcGhvdG8tMTQ2NDgyMjc1OTAyMy1mZWQ2MjJmZjJjM2I/YXV0bz1mb3JtYXQmZml0PWNyb3Amdz0yODAwJnE9ODAnIH0sXHJcbiAgICB7IG5hbWU6ICdBYnN0cmFjdCBMaXF1aWQnLCB2YWx1ZTogJ2h0dHBzOi8vaW1hZ2VzLnVuc3BsYXNoLmNvbS9waG90by0xNTUwNjg0ODQ4LWZhYzFjNWI0ZTg1Mz9hdXRvPWZvcm1hdCZmaXQ9Y3JvcCZ3PTI4MDAmcT04MCcgfSxcclxuICAgIHsgbmFtZTogJ0NsZWFuIFdoaXRlJywgdmFsdWU6ICdodHRwczovL2ltYWdlcy51bnNwbGFzaC5jb20vcGhvdG8tMTUxNjg4MDcxMTY0MC1lZjdkYWY4MTVlOTI/YXV0bz1mb3JtYXQmZml0PWNyb3Amdz0yODAwJnE9ODAnIH0sXHJcbiAgICB7IG5hbWU6ICdEYXJrIFNwYWNlJywgdmFsdWU6ICdodHRwczovL2ltYWdlcy51bnNwbGFzaC5jb20vcGhvdG8tMTQ1MTE4NzU4MDQ1OS00MzQ5MDI3OWMwZmE/YXV0bz1mb3JtYXQmZml0PWNyb3Amdz0yODAwJnE9ODAnIH0sXHJcbiAgXTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmFkZS1pbiBmb3JtLWNvbnRhaW5lclwiPlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInBhZ2UtaGVhZGVyXCI+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgIDxoMT5TZXR0aW5nczwvaDE+XHJcbiAgICAgICAgICA8cD5NYW5hZ2UgYXBwbGljYXRpb24gcHJlZmVyZW5jZXMgJiBQZXJzb25hbGl6YXRpb248L3A+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkLTNcIiBzdHlsZT17eyBtYXJnaW5Cb3R0b206ICczMnB4JyB9fT5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdsYXNzLXBhbmVsIGh1Yi1jYXJkXCIgc3R5bGU9e3sgcGFkZGluZzogJzIwcHgnIH19PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJodWItaWNvblwiIHN0eWxlPXt7IHdpZHRoOiA0NCwgaGVpZ2h0OiA0NCwgY29sb3I6ICd2YXIoLS1wcmltYXJ5LWNvbG9yKScgfX0+PEJveCBzaXplPXsyNH0gLz48L2Rpdj5cclxuICAgICAgICAgIDxzcGFuPkNvbXBhbnk8L3NwYW4+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJnbGFzcy1wYW5lbCBodWItY2FyZFwiIHN0eWxlPXt7IHBhZGRpbmc6ICcyMHB4JyB9fT5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaHViLWljb25cIiBzdHlsZT17eyB3aWR0aDogNDQsIGhlaWdodDogNDQsIGNvbG9yOiAndmFyKC0tcHJpbWFyeS1jb2xvciknIH19PjxVc2VyIHNpemU9ezI0fSAvPjwvZGl2PlxyXG4gICAgICAgICAgPHNwYW4+UHJvZmlsZTwvc3Bhbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdsYXNzLXBhbmVsIGh1Yi1jYXJkXCIgc3R5bGU9e3sgcGFkZGluZzogJzIwcHgnIH19PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJodWItaWNvblwiIHN0eWxlPXt7IHdpZHRoOiA0NCwgaGVpZ2h0OiA0NCwgY29sb3I6ICd2YXIoLS1wcmltYXJ5LWNvbG9yKScgfX0+PEJlbGwgc2l6ZT17MjR9IC8+PC9kaXY+XHJcbiAgICAgICAgICA8c3Bhbj5Ob3RpZmljYXRpb25zPC9zcGFuPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxoMyBjbGFzc05hbWU9XCJzZWN0aW9uLXRpdGxlXCI+UGVyc29uYWxpemF0aW9uIChUaGVtZSAmIENvbG9yKTwvaDM+XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLWZvcm0tZ3JvdXBcIj5cclxuICAgICAgICBcclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImlvcy1pbnB1dC1yb3dcIiBzdHlsZT17eyBkaXNwbGF5OiAnYmxvY2snIH19PlxyXG4gICAgICAgICAgPGxhYmVsIHN0eWxlPXt7IGRpc3BsYXk6ICdibG9jaycsIG1hcmdpbkJvdHRvbTogJzEycHgnIH19PkFwcCBQcmltYXJ5IENvbG9yPC9sYWJlbD5cclxuICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBnYXA6ICcxMnB4JywgZmxleFdyYXA6ICd3cmFwJyB9fT5cclxuICAgICAgICAgICAge3ByZWRlZmluZWRDb2xvcnMubWFwKChjb2xvciwgaWR4KSA9PiAoXHJcbiAgICAgICAgICAgICAgPGRpdiBcclxuICAgICAgICAgICAgICAgIGtleT17aWR4fVxyXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0UHJpbWFyeUNvbG9yKGNvbG9yLnZhbHVlKX1cclxuICAgICAgICAgICAgICAgIHN0eWxlPXt7IFxyXG4gICAgICAgICAgICAgICAgICB3aWR0aDogMzYsIGhlaWdodDogMzYsIGJvcmRlclJhZGl1czogMTgsIGJhY2tncm91bmQ6IGNvbG9yLnZhbHVlLCBcclxuICAgICAgICAgICAgICAgICAgY3Vyc29yOiAncG9pbnRlcicsIGJvcmRlcjogcHJpbWFyeUNvbG9yID09PSBjb2xvci52YWx1ZSA/ICczcHggc29saWQgd2hpdGUnIDogJzJweCBzb2xpZCB0cmFuc3BhcmVudCcsXHJcbiAgICAgICAgICAgICAgICAgIGJveFNoYWRvdzogcHJpbWFyeUNvbG9yID09PSBjb2xvci52YWx1ZSA/ICcwIDAgMCAycHggcmdiYSgwLDAsMCwwLjIpJyA6ICcwIDJweCA0cHggcmdiYSgwLDAsMCwwLjEpJ1xyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAgIHRpdGxlPXtjb2xvci5uYW1lfVxyXG4gICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLWlucHV0LXJvd1wiIHN0eWxlPXt7IGRpc3BsYXk6ICdibG9jaycgfX0+XHJcbiAgICAgICAgICA8bGFiZWwgc3R5bGU9e3sgZGlzcGxheTogJ2Jsb2NrJywgbWFyZ2luQm90dG9tOiAnMTJweCcgfX0+QmFja2dyb3VuZCBJbWFnZTwvbGFiZWw+XHJcbiAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdncmlkJywgZ3JpZFRlbXBsYXRlQ29sdW1uczogJ3JlcGVhdChhdXRvLWZpbGwsIG1pbm1heCgxMjBweCwgMWZyKSknLCBnYXA6ICcxMnB4JyB9fT5cclxuICAgICAgICAgICAge3ByZWRlZmluZWRCYWNrZ3JvdW5kcy5tYXAoKGJnLCBpZHgpID0+IChcclxuICAgICAgICAgICAgICA8ZGl2IFxyXG4gICAgICAgICAgICAgICAga2V5PXtpZHh9XHJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRCZ0ltYWdlKGJnLnZhbHVlKX1cclxuICAgICAgICAgICAgICAgIHN0eWxlPXt7IFxyXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6IDgwLCBib3JkZXJSYWRpdXM6IDEyLCBjdXJzb3I6ICdwb2ludGVyJyxcclxuICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlOiBgdXJsKCcke2JnLnZhbHVlfScpYCwgYmFja2dyb3VuZFNpemU6ICdjb3ZlcicsIGJhY2tncm91bmRQb3NpdGlvbjogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgICAgIGJvcmRlcjogYmdJbWFnZSA9PT0gYmcudmFsdWUgPyAnM3B4IHNvbGlkIHZhcigtLXByaW1hcnktY29sb3IpJyA6ICcycHggc29saWQgdHJhbnNwYXJlbnQnLFxyXG4gICAgICAgICAgICAgICAgICBib3hTaGFkb3c6ICcwIDRweCAxMnB4IHJnYmEoMCwwLDAsMC4xKSdcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICAgICB0aXRsZT17YmcubmFtZX1cclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICApKX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBzdHlsZT17eyBtYXJnaW5Ub3A6ICcxNnB4JyB9fT5cclxuICAgICAgICAgICAgPGxhYmVsIHN0eWxlPXt7IGZvbnRTaXplOiAnMTNweCcsIGRpc3BsYXk6ICdibG9jaycsIG1hcmdpbkJvdHRvbTogJzZweCcgfX0+Q3VzdG9tIEJhY2tncm91bmQgVVJMPC9sYWJlbD5cclxuICAgICAgICAgICAgPGlucHV0IFxyXG4gICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCIgXHJcbiAgICAgICAgICAgICAgdmFsdWU9e2JnSW1hZ2V9XHJcbiAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRCZ0ltYWdlKGUudGFyZ2V0LnZhbHVlKX1cclxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlBhc3RlIGltYWdlIFVSTCBoZXJlLi4uXCIgXHJcbiAgICAgICAgICAgICAgc3R5bGU9e3sgd2lkdGg6ICcxMDAlJywgcGFkZGluZzogJzEycHgnLCBib3JkZXJSYWRpdXM6ICcxMHB4JywgYmFja2dyb3VuZDogJ3JnYmEoMCwwLDAsMC4wNSknLCB0ZXh0QWxpZ246ICdsZWZ0JyB9fVxyXG4gICAgICAgICAgICAvPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLWlucHV0LXJvd1wiIHN0eWxlPXt7IGRpc3BsYXk6ICdibG9jaycgfX0+XHJcbiAgICAgICAgICA8bGFiZWwgc3R5bGU9e3sgZGlzcGxheTogJ2Jsb2NrJywgbWFyZ2luQm90dG9tOiAnMTJweCcgfX0+Q2FyZCBPcGFjaXR5IChUcmFuc3BhcmVuY3kpPC9sYWJlbD5cclxuICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAnMTJweCcgfX0+XHJcbiAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAnMTNweCcsIG9wYWNpdHk6IDAuNiB9fT5UcmFuc3BhcmVudDwvc3Bhbj5cclxuICAgICAgICAgICAgPGlucHV0IFxyXG4gICAgICAgICAgICAgIHR5cGU9XCJyYW5nZVwiIFxyXG4gICAgICAgICAgICAgIG1pbj1cIjAuMVwiIFxyXG4gICAgICAgICAgICAgIG1heD1cIjFcIiBcclxuICAgICAgICAgICAgICBzdGVwPVwiMC4wNVwiXHJcbiAgICAgICAgICAgICAgdmFsdWU9e2dsYXNzT3BhY2l0eX1cclxuICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEdsYXNzT3BhY2l0eShwYXJzZUZsb2F0KGUudGFyZ2V0LnZhbHVlKSl9XHJcbiAgICAgICAgICAgICAgc3R5bGU9e3sgZmxleDogMSwgYWNjZW50Q29sb3I6ICd2YXIoLS1wcmltYXJ5LWNvbG9yKScsIGN1cnNvcjogJ3BvaW50ZXInIH19XHJcbiAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAnMTNweCcsIG9wYWNpdHk6IDAuNiB9fT5Tb2xpZDwvc3Bhbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDxoMyBjbGFzc05hbWU9XCJzZWN0aW9uLXRpdGxlXCI+QXBwbGljYXRpb24gU2V0dGluZ3M8L2gzPlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImlvcy1mb3JtLWdyb3VwXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpb3MtaW5wdXQtcm93XCI+XHJcbiAgICAgICAgICA8bGFiZWw+RGFyayBNb2RlPC9sYWJlbD5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3dpdGNoLWNvbnRhaW5lclwiPlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImlvcy1zd2l0Y2hcIj48L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaW9zLWlucHV0LXJvd1wiPlxyXG4gICAgICAgICAgPGxhYmVsPkF1dG8gU3luYzwvbGFiZWw+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInN3aXRjaC1jb250YWluZXJcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpb3Mtc3dpdGNoIG9uXCI+PC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImlvcy1pbnB1dC1yb3dcIj5cclxuICAgICAgICAgIDxsYWJlbD5MYW5ndWFnZTwvbGFiZWw+XHJcbiAgICAgICAgICA8c2VsZWN0PlxyXG4gICAgICAgICAgICA8b3B0aW9uPkVuZ2xpc2g8L29wdGlvbj5cclxuICAgICAgICAgICAgPG9wdGlvbj5IaW5kaTwvb3B0aW9uPlxyXG4gICAgICAgICAgPC9zZWxlY3Q+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIEFwcCgpIHtcclxuICBjb25zdCBbY3VycmVudFRhYiwgc2V0Q3VycmVudFRhYl0gPSB1c2VTdGF0ZSgnZGFzaGJvYXJkJyk7XHJcbiAgY29uc3QgW3NpZGViYXJPcGVuLCBzZXRTaWRlYmFyT3Blbl0gPSB1c2VTdGF0ZShmYWxzZSk7XHJcbiAgY29uc3QgW3ByaW1hcnlDb2xvciwgc2V0UHJpbWFyeUNvbG9yXSA9IHVzZVN0YXRlKCcjMDA3YWZmJyk7XHJcbiAgY29uc3QgW2JnSW1hZ2UsIHNldEJnSW1hZ2VdID0gdXNlU3RhdGUoJ2h0dHBzOi8vaW1hZ2VzLnVuc3BsYXNoLmNvbS9waG90by0xNTA3NTI1NDI4MDM0LWI3MjNjZjk2MWQzZT9hdXRvPWZvcm1hdCZmaXQ9Y3JvcCZ3PTI4MDAmcT04MCcpO1xyXG4gIGNvbnN0IFtnbGFzc09wYWNpdHksIHNldEdsYXNzT3BhY2l0eV0gPSB1c2VTdGF0ZSgwLjU1KTtcclxuXHJcbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1wcmltYXJ5LWNvbG9yJywgcHJpbWFyeUNvbG9yKTtcclxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1iZy1pbWFnZScsIGB1cmwoJyR7YmdJbWFnZX0nKWApO1xyXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWdsYXNzLWJnJywgYHJnYmEoMjU1LCAyNTUsIDI1NSwgJHtnbGFzc09wYWNpdHl9KWApO1xyXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWdsYXNzLWJvcmRlcicsIGByZ2JhKDI1NSwgMjU1LCAyNTUsICR7TWF0aC5taW4oZ2xhc3NPcGFjaXR5ICsgMC4yLCAxKX0pYCk7XHJcbiAgfSwgW3ByaW1hcnlDb2xvciwgYmdJbWFnZSwgZ2xhc3NPcGFjaXR5XSk7XHJcblxyXG4gIGNvbnN0IGNoYW5nZVRoZW1lID0gKGh1ZSwgdGludCkgPT4ge1xyXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWJnLWh1ZScsIGh1ZSk7XHJcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tYmctdGludCcsIHRpbnQpO1xyXG4gIH07XHJcblxyXG4gIGNvbnN0IGNsb3NlU2lkZWJhciA9ICgpID0+IHNldFNpZGViYXJPcGVuKGZhbHNlKTtcclxuICBjb25zdCBoYW5kbGVOYXYgPSAodGFiKSA9PiB7XHJcbiAgICBzZXRDdXJyZW50VGFiKHRhYik7XHJcbiAgICBjbG9zZVNpZGViYXIoKTtcclxuICB9O1xyXG5cclxuICBjb25zdCByZW5kZXJDb250ZW50ID0gKCkgPT4ge1xyXG4gICAgc3dpdGNoKGN1cnJlbnRUYWIpIHtcclxuICAgICAgY2FzZSAnZGFzaGJvYXJkJzogcmV0dXJuIDxEYXNoYm9hcmQgc2V0Q3VycmVudFRhYj17c2V0Q3VycmVudFRhYn0gLz47XHJcbiAgICAgIGNhc2UgJ3NhbGVzJzogXHJcbiAgICAgIGNhc2UgJ3B1cmNoYXNlJzogXHJcbiAgICAgIGNhc2UgJ3JlY2VpcHQnOiBcclxuICAgICAgY2FzZSAncGF5bWVudCc6IFxyXG4gICAgICBjYXNlICdqb3VybmFsJzogXHJcbiAgICAgIGNhc2UgJ2NvbnRyYSc6IFxyXG4gICAgICAgIHJldHVybiA8Q3JlYXRlRW50cnkgdHlwZT17Y3VycmVudFRhYn0gLz47XHJcbiAgICAgIGNhc2UgJ3JlcG9ydHMnOiByZXR1cm4gPFJlcG9ydHNIdWIgLz47XHJcbiAgICAgIGNhc2UgJ2l0ZW1zJzogcmV0dXJuIDxJdGVtc0h1YiAvPjtcclxuICAgICAgY2FzZSAncGFydGllcyc6IHJldHVybiA8UGFydGllc0h1YiAvPjtcclxuICAgICAgY2FzZSAnb3V0c3RhbmRpbmcnOiByZXR1cm4gPE91dHN0YW5kaW5nSHViIC8+O1xyXG4gICAgICBjYXNlICdzZXR0aW5ncyc6IHJldHVybiA8U2V0dGluZ3NIdWIgXHJcbiAgICAgICAgICBwcmltYXJ5Q29sb3I9e3ByaW1hcnlDb2xvcn0gc2V0UHJpbWFyeUNvbG9yPXtzZXRQcmltYXJ5Q29sb3J9IFxyXG4gICAgICAgICAgYmdJbWFnZT17YmdJbWFnZX0gc2V0QmdJbWFnZT17c2V0QmdJbWFnZX0gXHJcbiAgICAgICAgICBnbGFzc09wYWNpdHk9e2dsYXNzT3BhY2l0eX0gc2V0R2xhc3NPcGFjaXR5PXtzZXRHbGFzc09wYWNpdHl9XHJcbiAgICAgICAgLz47XHJcbiAgICAgIGRlZmF1bHQ6IHJldHVybiA8RGFzaGJvYXJkIHNldEN1cnJlbnRUYWI9e3NldEN1cnJlbnRUYWJ9IC8+O1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IG5hdkl0ZW1zID0gW1xyXG4gICAgeyBpZDogJ2Rhc2hib2FyZCcsIG5hbWU6ICdEYXNoYm9hcmQnLCBpY29uOiA8SG9tZSBzaXplPXsxOH0gLz4sIGNvbG9yOiAnIzAwN2FmZicgfSxcclxuICAgIHsgaWQ6ICdzYWxlcycsIG5hbWU6ICdTYWxlcycsIGljb246IDxGaWxlVGV4dCBzaXplPXsxOH0gLz4sIGNvbG9yOiAnIzM0Yzc1OScgfSxcclxuICAgIHsgaWQ6ICdwdXJjaGFzZScsIG5hbWU6ICdQdXJjaGFzZScsIGljb246IDxTaG9wcGluZ0NhcnQgc2l6ZT17MTh9IC8+LCBjb2xvcjogJyNmZjk1MDAnIH0sXHJcbiAgICB7IGlkOiAncmVjZWlwdCcsIG5hbWU6ICdSZWNlaXB0JywgaWNvbjogPEFycm93RG93blJpZ2h0IHNpemU9ezE4fSAvPiwgY29sb3I6ICcjNTg1NmQ2JyB9LFxyXG4gICAgeyBpZDogJ3BheW1lbnQnLCBuYW1lOiAnUGF5bWVudCcsIGljb246IDxBcnJvd1VwUmlnaHQgc2l6ZT17MTh9IC8+LCBjb2xvcjogJyNmZjJkNTUnIH0sXHJcbiAgICB7IGlkOiAnam91cm5hbCcsIG5hbWU6ICdKb3VybmFsJywgaWNvbjogPEZpbGVUZXh0IHNpemU9ezE4fSAvPiwgY29sb3I6ICcjNWFjOGZhJyB9LFxyXG4gICAgeyBpZDogJ2NvbnRyYScsIG5hbWU6ICdDb250cmEnLCBpY29uOiA8TGFuZG1hcmsgc2l6ZT17MTh9IC8+LCBjb2xvcjogJyNmZmNjMDAnIH0sXHJcbiAgICB7IGlkOiAncmVwb3J0cycsIG5hbWU6ICdSZXBvcnRzJywgaWNvbjogPFBpZUNoYXJ0IHNpemU9ezE4fSAvPiwgY29sb3I6ICcjZmY5NTAwJyB9LFxyXG4gICAgeyBpZDogJ2l0ZW1zJywgbmFtZTogJ0l0ZW1zJywgaWNvbjogPFBhY2thZ2Ugc2l6ZT17MTh9IC8+LCBjb2xvcjogJyMwMDdhZmYnIH0sXHJcbiAgICB7IGlkOiAncGFydGllcycsIG5hbWU6ICdQYXJ0aWVzJywgaWNvbjogPFVzZXJzIHNpemU9ezE4fSAvPiwgY29sb3I6ICcjMzRjNzU5JyB9LFxyXG4gICAgeyBpZDogJ291dHN0YW5kaW5nJywgbmFtZTogJ091dHN0YW5kaW5nJywgaWNvbjogPEZpbGVTcHJlYWRzaGVldCBzaXplPXsxOH0gLz4sIGNvbG9yOiAnI2ZmM2IzMCcgfSxcclxuICAgIHsgaWQ6ICdzYWxlc190ZWFtJywgbmFtZTogJ1NhbGVzIFRlYW0nLCBpY29uOiA8QnJpZWZjYXNlIHNpemU9ezE4fSAvPiwgY29sb3I6ICcjNTg1NmQ2JyB9LFxyXG4gICAgeyBpZDogJ2FjdGl2aXR5JywgbmFtZTogJ0FjdGl2aXR5JywgaWNvbjogPEFjdGl2aXR5IHNpemU9ezE4fSAvPiwgY29sb3I6ICcjOGU4ZTkzJyB9LFxyXG4gIF07XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImFwcC1jb250YWluZXJcIj5cclxuICAgICAgXHJcbiAgICAgIHsvKiBNb2JpbGUgU2lkZWJhciBPdmVybGF5ICovfVxyXG4gICAgICA8ZGl2IFxyXG4gICAgICAgIGNsYXNzTmFtZT17YHNpZGViYXItb3ZlcmxheSAke3NpZGViYXJPcGVuID8gJ29wZW4nIDogJyd9YH0gXHJcbiAgICAgICAgc3R5bGU9e3sgZGlzcGxheTogc2lkZWJhck9wZW4gPyAnYmxvY2snIDogJ25vbmUnIH19XHJcbiAgICAgICAgb25DbGljaz17Y2xvc2VTaWRlYmFyfVxyXG4gICAgICA+PC9kaXY+XHJcblxyXG4gICAgICB7LyogUmVzcG9uc2l2ZSBHbGFzcyBTaWRlYmFyICovfVxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YGdsYXNzLXBhbmVsIGdsYXNzLXNpZGViYXIgJHtzaWRlYmFyT3BlbiA/ICdvcGVuJyA6ICcnfWB9PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnJhbmRcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYnJhbmQtaWNvblwiPlxyXG4gICAgICAgICAgICA8R3JpZCBzaXplPXsyMH0gLz5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGgyPlRhbGx5Q29ubmVjdDwvaDI+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibmF2LW1lbnVcIj5cclxuICAgICAgICAgIHtuYXZJdGVtcy5tYXAoaXRlbSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGlzQWN0aXZlID0gY3VycmVudFRhYiA9PT0gaXRlbS5pZDtcclxuICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICA8ZGl2IFxyXG4gICAgICAgICAgICAgICAga2V5PXtpdGVtLmlkfVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgbmF2LWl0ZW0gJHtpc0FjdGl2ZSA/ICdhY3RpdmUnIDogJyd9YH0gXHJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBoYW5kbGVOYXYoaXRlbS5pZCl9XHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBcclxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwibmF2LWljb24tY29udGFpbmVyXCJcclxuICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGlzQWN0aXZlID8gJ3doaXRlJyA6IGl0ZW0uY29sb3IsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IGlzQWN0aXZlID8gJ3ZhcigtLXByaW1hcnktY29sb3IpJyA6ICd3aGl0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgYm94U2hhZG93OiBpc0FjdGl2ZSA/ICdub25lJyA6IGAwIDJweCA2cHggJHtpdGVtLmNvbG9yfTQwYFxyXG4gICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICB7aXRlbS5pY29ufVxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8c3Bhbj57aXRlbS5uYW1lfTwvc3Bhbj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgIH0pfVxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm5hdi1tZW51IHNpZGViYXItYm90dG9tXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17YG5hdi1pdGVtICR7Y3VycmVudFRhYiA9PT0gJ3NldHRpbmdzJyA/ICdhY3RpdmUnIDogJyd9YH0gb25DbGljaz17KCkgPT4gaGFuZGxlTmF2KCdzZXR0aW5ncycpfT5cclxuICAgICAgICAgICAgPGRpdiBcclxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJuYXYtaWNvbi1jb250YWluZXJcIlxyXG4gICAgICAgICAgICAgIHN0eWxlPXt7XHJcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGN1cnJlbnRUYWIgPT09ICdzZXR0aW5ncycgPyAnd2hpdGUnIDogJyM4ZThlOTMnLFxyXG4gICAgICAgICAgICAgICAgY29sb3I6IGN1cnJlbnRUYWIgPT09ICdzZXR0aW5ncycgPyAndmFyKC0tcHJpbWFyeS1jb2xvciknIDogJ3doaXRlJyxcclxuICAgICAgICAgICAgICAgIGJveFNoYWRvdzogY3VycmVudFRhYiA9PT0gJ3NldHRpbmdzJyA/ICdub25lJyA6IGAwIDJweCA2cHggIzhlOGU5MzQwYFxyXG4gICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICA8U2V0dGluZ3Mgc2l6ZT17MTh9IC8+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8c3Bhbj5TZXR0aW5nczwvc3Bhbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJuYXYtaXRlbVwiIHN0eWxlPXt7IGNvbG9yOiAndmFyKC0tZGFuZ2VyKScgfX0+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibmF2LWljb24tY29udGFpbmVyXCIgc3R5bGU9e3sgYmFja2dyb3VuZENvbG9yOiAndHJhbnNwYXJlbnQnLCBjb2xvcjogJ3ZhcigtLWRhbmdlciknLCBib3hTaGFkb3c6ICdub25lJyB9fT5cclxuICAgICAgICAgICAgICA8TG9nT3V0IHNpemU9ezIyfSAvPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPHNwYW4+TG9nIE91dDwvc3Bhbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIHsvKiBNYWluIENvbnRlbnQgKi99XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwibWFpbi13cmFwcGVyXCI+XHJcbiAgICAgICAgXHJcbiAgICAgICAgey8qIFRvcCBIZWFkZXIgKi99XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJnbGFzcy1oZWFkZXIgZ2xhc3MtcGFuZWxcIiBzdHlsZT17eyBib3JkZXJSYWRpdXM6ICcxNnB4JywgYmFja2dyb3VuZDogJ3ZhcigtLWdsYXNzLWJnKScsIGJvcmRlcjogJ25vbmUnIH19PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoZWFkZXItbGVmdFwiPlxyXG4gICAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT1cIm1lbnUtdG9nZ2xlXCIgb25DbGljaz17KCkgPT4gc2V0U2lkZWJhck9wZW4odHJ1ZSl9PlxyXG4gICAgICAgICAgICAgIDxNZW51IHNpemU9ezI0fSAvPlxyXG4gICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoZWFkZXItc2VhcmNoXCI+XHJcbiAgICAgICAgICAgICAgPFNlYXJjaCBzaXplPXsxOH0gY29sb3I9XCJyZ2JhKDAsMCwwLDAuNClcIiAvPlxyXG4gICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoIGFueXRoaW5nLi4uXCIgLz5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImhlYWRlci1hY3Rpb25zXCIgc3R5bGU9e3sgcG9zaXRpb246ICdyZWxhdGl2ZScgfX0+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiaWNvbi1idG5cIiB0aXRsZT1cIlF1aWNrIEFkZFwiPlxyXG4gICAgICAgICAgICAgIDxQbHVzIHNpemU9ezIwfSAvPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJpY29uLWJ0blwiIHRpdGxlPVwiTm90aWZpY2F0aW9uc1wiIHN0eWxlPXt7IHBvc2l0aW9uOiAncmVsYXRpdmUnIH19PlxyXG4gICAgICAgICAgICAgIDxCZWxsIHNpemU9ezIwfSAvPlxyXG4gICAgICAgICAgICAgIDxkaXYgc3R5bGU9e3sgcG9zaXRpb246ICdhYnNvbHV0ZScsIHRvcDogOCwgcmlnaHQ6IDgsIHdpZHRoOiA4LCBoZWlnaHQ6IDgsIGJhY2tncm91bmQ6ICd2YXIoLS1kYW5nZXIpJywgYm9yZGVyUmFkaXVzOiA0LCBib3JkZXI6ICcycHggc29saWQgd2hpdGUnIH19PjwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBzdHlsZT17eyB3aWR0aDogJzFweCcsIGhlaWdodDogJzI0cHgnLCBiYWNrZ3JvdW5kOiAncmdiYSgwLDAsMCwwLjEpJywgbWFyZ2luOiAnMCA4cHgnIH19PjwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2NlbnRlcicsIGdhcDogJzhweCcsIGN1cnNvcjogJ3BvaW50ZXInLCBwYWRkaW5nOiAnNnB4IDEycHgnLCBiYWNrZ3JvdW5kOiAncmdiYSgwLDAsMCwwLjA1KScsIGJvcmRlclJhZGl1czogJzIwcHgnLCB0cmFuc2l0aW9uOiAnMC4ycycgfX0+XHJcbiAgICAgICAgICAgICAgPGRpdiBzdHlsZT17eyB3aWR0aDogMjgsIGhlaWdodDogMjgsIGJvcmRlclJhZGl1czogMTQsIGJhY2tncm91bmQ6ICd2YXIoLS1wcmltYXJ5LWNvbG9yKScsIGNvbG9yOiAnd2hpdGUnLCBkaXNwbGF5OiAnZmxleCcsIGFsaWduSXRlbXM6ICdjZW50ZXInLCBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsIGZvbnRTaXplOiAnMTNweCcsIGZvbnRXZWlnaHQ6ICdib2xkJyB9fT5cclxuICAgICAgICAgICAgICAgIFRcclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogJzE0cHgnLCBmb250V2VpZ2h0OiA2MDAgfX0+VGFsbHkgVXNlcjwvc3Bhbj5cclxuICAgICAgICAgICAgICA8Q2hldnJvblJpZ2h0IHNpemU9ezE2fSBjb2xvcj1cInJnYmEoMCwwLDAsMC40KVwiIC8+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIHsvKiBDb250ZW50IFZpZXcgKi99XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjb250ZW50LXNjcm9sbFwiPlxyXG4gICAgICAgICAge3JlbmRlckNvbnRlbnQoKX1cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgQXBwOyJdfQ==