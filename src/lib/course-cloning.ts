import type { CatalogCourse } from "./course-catalog.ts";

type CloneOverrides = {
  slug: string;
  title: string;
  shortDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export function buildClonedCourseInput(source: CatalogCourse, overrides: CloneOverrides) {
  return {
    slug: overrides.slug,
    title: overrides.title,
    shortDescription: overrides.shortDescription ?? source.shortDescription,
    description: source.description,
    priceInCents: source.priceInCents,
    duration: source.duration,
    format: source.format,
    level: source.level,
    accentFrom: source.accentFrom,
    accentTo: source.accentTo,
    category: source.category,
    audienceJson: source.audience,
    outcomesJson: source.outcomes,
    methodologyJson: source.methodology,
    faqJson: source.faq,
    seoTitle: overrides.seoTitle ?? source.seoTitle,
    seoDescription: overrides.seoDescription ?? source.seoDescription,
    status: "ACTIVE" as const,
    modules: source.modules.map((module, index) => ({
      moduleKey: module.id,
      title: module.title,
      description: module.description,
      estimatedTime: module.estimatedTime,
      resourcesSummary: module.resourcesSummary,
      position: index
    }))
  };
}
