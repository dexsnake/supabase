import { ident } from '../../../pg-format'

export const getCreateVaultSecretSQL = ({
  secret,
  name,
  description,
}: {
  secret: string
  name?: string
  description?: string
}) => {
  const sql = /* SQL */ `
  select vault.create_secret(
      new_secret := ${ident(secret)}
    ${name ? `, new_name := ${ident(name)}` : ''}
    ${description ? `, new_description := ${ident(description)}` : ''}
  )
  `.trim()

  return sql
}

export const getUpdateVaultSecretSQL = ({
  id,
  secret,
  name,
  description,
}: {
  id: string
  secret?: string
  name?: string
  description?: string
}) => {
  const sql = /* SQL */ `
select vault.update_secret(
    secret_id := ${ident(id)}
  ${secret ? `, new_secret := ${ident(secret)}` : ''}
  ${name ? `, new_name := ${ident(name)}` : ''}
  ${description ? `, new_description := ${ident(description)}` : ''}
)
`.trim()
  return sql
}
