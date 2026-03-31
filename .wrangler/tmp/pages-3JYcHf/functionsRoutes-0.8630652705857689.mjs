import { onRequestDelete as __api_expenses__id__js_onRequestDelete } from "/Users/user/.gemini/antigravity/scratch/knot-and-pins-app/functions/api/expenses/[id].js"
import { onRequestDelete as __api_purchases__id__js_onRequestDelete } from "/Users/user/.gemini/antigravity/scratch/knot-and-pins-app/functions/api/purchases/[id].js"
import { onRequestDelete as __api_sales__id__js_onRequestDelete } from "/Users/user/.gemini/antigravity/scratch/knot-and-pins-app/functions/api/sales/[id].js"
import { onRequestGet as __api_expenses_index_js_onRequestGet } from "/Users/user/.gemini/antigravity/scratch/knot-and-pins-app/functions/api/expenses/index.js"
import { onRequestPost as __api_expenses_index_js_onRequestPost } from "/Users/user/.gemini/antigravity/scratch/knot-and-pins-app/functions/api/expenses/index.js"
import { onRequestGet as __api_purchases_index_js_onRequestGet } from "/Users/user/.gemini/antigravity/scratch/knot-and-pins-app/functions/api/purchases/index.js"
import { onRequestPost as __api_purchases_index_js_onRequestPost } from "/Users/user/.gemini/antigravity/scratch/knot-and-pins-app/functions/api/purchases/index.js"
import { onRequestGet as __api_sales_index_js_onRequestGet } from "/Users/user/.gemini/antigravity/scratch/knot-and-pins-app/functions/api/sales/index.js"
import { onRequestPost as __api_sales_index_js_onRequestPost } from "/Users/user/.gemini/antigravity/scratch/knot-and-pins-app/functions/api/sales/index.js"
import { onRequestGet as __api_settings_js_onRequestGet } from "/Users/user/.gemini/antigravity/scratch/knot-and-pins-app/functions/api/settings.js"
import { onRequestPost as __api_settings_js_onRequestPost } from "/Users/user/.gemini/antigravity/scratch/knot-and-pins-app/functions/api/settings.js"

export const routes = [
    {
      routePath: "/api/expenses/:id",
      mountPath: "/api/expenses",
      method: "DELETE",
      middlewares: [],
      modules: [__api_expenses__id__js_onRequestDelete],
    },
  {
      routePath: "/api/purchases/:id",
      mountPath: "/api/purchases",
      method: "DELETE",
      middlewares: [],
      modules: [__api_purchases__id__js_onRequestDelete],
    },
  {
      routePath: "/api/sales/:id",
      mountPath: "/api/sales",
      method: "DELETE",
      middlewares: [],
      modules: [__api_sales__id__js_onRequestDelete],
    },
  {
      routePath: "/api/expenses",
      mountPath: "/api/expenses",
      method: "GET",
      middlewares: [],
      modules: [__api_expenses_index_js_onRequestGet],
    },
  {
      routePath: "/api/expenses",
      mountPath: "/api/expenses",
      method: "POST",
      middlewares: [],
      modules: [__api_expenses_index_js_onRequestPost],
    },
  {
      routePath: "/api/purchases",
      mountPath: "/api/purchases",
      method: "GET",
      middlewares: [],
      modules: [__api_purchases_index_js_onRequestGet],
    },
  {
      routePath: "/api/purchases",
      mountPath: "/api/purchases",
      method: "POST",
      middlewares: [],
      modules: [__api_purchases_index_js_onRequestPost],
    },
  {
      routePath: "/api/sales",
      mountPath: "/api/sales",
      method: "GET",
      middlewares: [],
      modules: [__api_sales_index_js_onRequestGet],
    },
  {
      routePath: "/api/sales",
      mountPath: "/api/sales",
      method: "POST",
      middlewares: [],
      modules: [__api_sales_index_js_onRequestPost],
    },
  {
      routePath: "/api/settings",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_settings_js_onRequestGet],
    },
  {
      routePath: "/api/settings",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_settings_js_onRequestPost],
    },
  ]