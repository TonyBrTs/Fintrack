import currencyData from "cldr-core/supplemental/currencyData.json";

type Period = { _from?: string; _to?: string; _tender?: string };
const regions: Record<string, Partial<Record<string, Period>>[]> =
  currencyData.supplemental.currencyData.region;
const today = new Date().toISOString().slice(0, 10);

export const currencyChoices = Object.entries(regions).flatMap(([country, periods]) =>
  periods.flatMap((entry) =>
    Object.entries(entry)
      .filter(([, period]) =>
        period && period._tender !== "false" && (!period._from || period._from <= today) &&
        (!period._to || period._to >= today)
      )
      .map(([currency]) => ({ id: country + "-" + currency, country, currency }))
  )
);

export function localizedCurrencyChoices(language: string) {
  const countries = new Intl.DisplayNames(language, { type: "region" });
  const currencies = new Intl.DisplayNames(language, { type: "currency" });
  const collator = new Intl.Collator(language);
  return currencyChoices.map(({ id, country, currency }) => ({
    id,
    label: countries.of(country) + " · " + currencies.of(currency) + " (" + currency + ")",
  })).sort((a, b) => collator.compare(a.label, b.label));
}
