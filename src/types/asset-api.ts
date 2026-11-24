import type { MapCoordinate } from './map'
import type { MaterialIcon } from './material-icons'

export interface Feature {
	type: FeatureType
	properties: FeatureProperties
	geometry: Geometry | null
	id?: number | string
	bbox?: number[]
	geometry_name?: GeometryName
}

export interface Geometry {
	type: GeometryType
	coordinates: number[][][]
	bbox?: number[]
}

export enum GeometryType {
	Polygon = 'Polygon'
}

export enum GeometryName {
	Location = 'Location'
}

export interface FeatureProperties {
	fid?: number
	id?: string
	Standort: string
	Gebaeude: string
	Etage: string
	Ebene: string
	Raum: string
	Funktion_de: string
	Funktion_en: string
	rtype?: number
	center?: MapCoordinate
	icon?: { ios: string; android: MaterialIcon }
}

export enum FeatureType {
	Feature = 'Feature'
}
