import Papa from 'papaparse'

export const parseCSV = (file) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => resolve({ data, headers: meta.fields }),
      error: reject,
    })
  })
