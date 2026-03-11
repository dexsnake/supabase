import { TAX_IDS, TaxId } from './TaxID.constants'

export const getTaxIdCountry = (taxId: TaxId): string => taxId.taxCountryIso2 ?? taxId.countryIso2

export const findTaxIdOption = (type: string, country: string, billingCountry?: string) => {
  const matches = TAX_IDS.filter(
    (option) =>
      option.type === type && (option.taxCountryIso2 ?? option.countryIso2) === country
  )

  if (matches.length <= 1 || !billingCountry) return matches[0]

  return matches.find((option) => option.countryIso2 === billingCountry) ?? matches[0]
}

export const sanitizeTaxIdValue = (taxId: { name: string; value: string }) => {
  const selectedTaxId = TAX_IDS.find((option) => option.name === taxId.name)

  const vatIdPrefix = selectedTaxId?.vatPrefix

  // if the value doesn't start with the prefix, prepend them
  if (vatIdPrefix && !taxId.value.startsWith(vatIdPrefix)) {
    return `${vatIdPrefix}${taxId.value}`
  }

  return taxId.value
}

/** Ignore id property amongst tax ids */
export const checkTaxIdEqual = (a: any, b: any) => {
  return a?.type === b?.type && a?.value === b?.value
}
