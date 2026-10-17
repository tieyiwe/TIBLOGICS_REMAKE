import type { IndustryPack, PromptDraft } from "./define";
import { REALTOR_EXTRA } from "./realtor";
import { FINANCE_EXTRA } from "./finance";
import { NONPROFIT_EXTRA } from "./nonprofit";
import { AGENCY_EXTRA } from "./agency";
import { RESTAURANT_EXTRA } from "./restaurant";
import { SOCIAL_WORK } from "./social-work";
import { MEDICAL } from "./medical";
import { LEGAL } from "./legal";
import { INSURANCE } from "./insurance";
import { HOME_SERVICES } from "./home-services";
import { ECOMMERCE } from "./ecommerce";
import { HR } from "./hr";

/** Prompts written for Toolkit Live, added to the original five toolkits. */
export const EXTRA_FOR_EXISTING: Record<string, PromptDraft[]> = {
  realtor: REALTOR_EXTRA,
  finance: FINANCE_EXTRA,
  nonprofit: NONPROFIT_EXTRA,
  agency: AGENCY_EXTRA,
  restaurant: RESTAURANT_EXTRA,
};

/** Industries that exist only in Toolkit Live. */
export const NEW_INDUSTRIES: IndustryPack[] = [SOCIAL_WORK, MEDICAL, LEGAL, INSURANCE, HOME_SERVICES, ECOMMERCE, HR];
