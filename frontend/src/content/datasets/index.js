import employeePracticeDataset from './employee-practice/index.js'
import moviesTheatersDataset from './movies-theaters/index.js'
import scottHrDataset from './scott-hr/index.js'

export const localDatasets = [
    employeePracticeDataset,
    moviesTheatersDataset,
    scottHrDataset,
]

export function getLocalDatasets() {
    return localDatasets
        .map(({ id, slug, name, description, expected_tables, version }) => ({
            id,
            slug,
            name,
            description,
            expected_tables,
            version,
        }))
        .sort((left, right) => left.name.localeCompare(right.name))
}

export function getLocalDataset(slug) {
    return localDatasets.find((dataset) => dataset.slug === slug) ?? null
}

export function getLocalPracticeItems(datasetSlug) {
    const dataset = getLocalDataset(datasetSlug)
    return dataset?.practice_items ?? []
}
