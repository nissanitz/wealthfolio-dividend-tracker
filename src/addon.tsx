import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AddonContext, AddonEnableFunction } from "@wealthfolio/addon-sdk";
import { DividendDashboard } from "./dashboard";

// The host owns the React root for this addon's route and mounts the component
// itself, so the addon context captured at enable time is handed down here.
let addonCtx: AddonContext | undefined;

const DividendRoute = () => (
  <QueryClientProvider client={addonCtx!.api.query.getClient() as QueryClient}>
    <DividendDashboard ctx={addonCtx!} />
  </QueryClientProvider>
);

const enable: AddonEnableFunction = (ctx) => {
  addonCtx = ctx;
  ctx.api.logger.info("Dividend Dashboard addon is being enabled");

  // Route id MUST match `contributes.routes[].id` in manifest.json.
  ctx.router.add({
    id: "dividend-dashboard",
    path: "/addons/dividend-dashboard",
    component: DividendRoute,
  });

  ctx.onDisable(() => {
    addonCtx = undefined;
  });
};

export default enable;
