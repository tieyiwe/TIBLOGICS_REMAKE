import {
  Bot,
  Zap,
  Brain,
  Globe,
  Shield,
  BarChart3,
  Smartphone,
  GraduationCap,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { getT } from "@/lib/i18n/server";

interface Service {
  icon: LucideIcon;
  /** Dictionary keys for the name and description. */
  nameKey: string;
  descKey: string;
  iconBg: string;
  core: boolean;
}

const services: Service[] = [
  { icon: Bot,           nameKey: "site.footer.svc.ai",         descKey: "home.servicesGrid.ai",         iconBg: "bg-[#EBF0FA]", core: true },
  { icon: Zap,           nameKey: "site.footer.svc.automation", descKey: "home.servicesGrid.automation", iconBg: "bg-[#EBF0FA]", core: true },
  { icon: Brain,         nameKey: "site.footer.svc.strategy",   descKey: "home.servicesGrid.strategy",   iconBg: "bg-[#EBF0FA]", core: true },
  { icon: Globe,         nameKey: "site.footer.svc.web",        descKey: "home.servicesGrid.web",        iconBg: "bg-[#FEF0E3]", core: false },
  { icon: Shield,        nameKey: "site.footer.svc.security",   descKey: "home.servicesGrid.security",   iconBg: "bg-[#FEF0E3]", core: false },
  { icon: BarChart3,     nameKey: "site.footer.svc.data",       descKey: "home.servicesGrid.data",       iconBg: "bg-[#FEF0E3]", core: false },
  { icon: Smartphone,    nameKey: "site.footer.svc.mobile",     descKey: "home.servicesGrid.mobile",     iconBg: "bg-green-50",  core: false },
  { icon: GraduationCap, nameKey: "site.footer.svc.training",   descKey: "home.servicesGrid.training",   iconBg: "bg-green-50",  core: false },
  { icon: Cpu,           nameKey: "home.servicesGrid.iot.name", descKey: "home.servicesGrid.iot",        iconBg: "bg-green-50",  core: false },
];

export default async function ServicesGrid() {
  const t = await getT();
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-10">
          <span className="section-tag">{t("home.services.tag")}</span>
          <h2 className="font-syne font-extrabold text-3xl md:text-4xl text-[#0D1B2A] mt-2">
            {t("home.services.title")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <div
                key={service.nameKey}
                className="anim-fade-up relative bg-white border border-[#D2DCE8] rounded-2xl p-6 hover:shadow-[0_4px_24px_rgba(27,58,107,0.12)] hover:-translate-y-0.5 transition-all duration-200"
                style={{ animationDelay: `${(i % 3) * 0.08}s` }}
              >
                {service.core && (
                  <span className="absolute top-4 right-4 bg-[#FEF0E3] text-[#F47C20] text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full">
                    {t("home.servicesGrid.badge")}
                  </span>
                )}
                <div className={`w-11 h-11 rounded-xl ${service.iconBg} flex items-center justify-center mb-4`}>
                  <Icon size={22} className="text-[#1B3A6B]" />
                </div>
                <h3 className="font-syne font-bold text-base text-[#0D1B2A]">{t(service.nameKey)}</h3>
                <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed mt-1">{t(service.descKey)}</p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
