import { useState } from 'react'

/** Tiny form state helper: bind('email') returns { name, value, onChange, error } for <Field>. */
export function useForm(initial) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})

  const bind = (name) => ({
    name,
    value: values[name] ?? '',
    error: errors[name],
    onChange: (e) => {
      const next = e.target.value
      setValues((v) => ({ ...v, [name]: next }))
      setErrors((errs) => (errs[name] ? { ...errs, [name]: '' } : errs))
    },
  })

  return { values, setValues, errors, setErrors, bind }
}
