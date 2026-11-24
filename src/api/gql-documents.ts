// biome-ignore-all lint/correctness/noUnusedVariables: needed for codegen

import { graphql } from '@/__generated__/gql'

export const ANNOUNCEMENT_QUERY = graphql(/* GraphQL */ `
    query AppAnnouncements {
        appAnnouncements(active: true) {
            ...AnnouncementFields
        }
    }
`)

const APP_ANNOUNCEMENT_FRAGMENT = graphql(/* GraphQL */ `
    fragment AnnouncementFields on Announcement {
        id
        title {
            de
            en
        }
        description {
            de
            en
        }
        startDateTime
        endDateTime
        priority
        url
        platform
        userKind
        imageUrl
    }
`)

export const FOOD_QUERY = graphql(/* GraphQL */ `
    query FoodPlan($locations: [LocationInput!]!, $language: String) {
        food(locations: $locations, language: $language) {
            ...FoodFields
        }
    }
`)

export const CANTEENS_QUERY = graphql(/* GraphQL */ `
    query Canteens($language: String) {
        canteens(language: $language) {
            id
            name
            address
            general {
                days
                time
            }
            distribution {
                days
                time
            }
        }
    }
`)

export const CAFETERIAS_QUERY = graphql(/* GraphQL */ `
    query Cafeterias($language: String) {
        cafeterias(language: $language) {
            id
            name
            campus
            available
            updatedAt
            germanOnly
            description
            offers {
                key
                title
            }
            address
            general {
                days
                time
                parsed {
                    weekdays
                    open
                    close
                }
            }
            distribution {
                days
                time
                parsed {
                    weekdays
                    open
                    close
                }
            }
            sourceUrl
            hasMenu
        }
    }
`)

const FOOD_FRAGMENT = graphql(/* GraphQL */ `
    fragment FoodFields on FoodResponse {
        foodData {
            timestamp
            meals {
                name {
                    de
                    en
                }
                id
                category
                prices {
                    student
                    employee
                    guest
                }
                allergens
                additives
                flags
                icons
                nutrition {
                    kj
                    kcal
                    fat
                    fatSaturated
                    carbs
                    sugar
                    fiber
                    protein
                    salt
                }
                variants {
                    name {
                        de
                        en
                    }
                    additional
                    id
                    allergens
                    flags
                    originalLanguage
                    static
                    restaurant
                    parent {
                        id
                        category
                    }
                    prices {
                        student
                        employee
                        guest
                    }
                }
                originalLanguage
                static
                restaurant
            }
        }
        errors {
            location
            message
        }
    }
`)

export const HAW_CLUBS_QUERY = graphql(/* GraphQL */ `
 query HawClubs($language: String) {
  hawClubs(language: $language) {
   available stale updatedAt sourceUrl
   clubs { id title description descriptionHtml contentLanguage sourceUrl links { title url } }
  }
 }
`)

// Older public servers do not yet expose the optional rich content fields.
export const HAW_CLUBS_LEGACY_QUERY = graphql(/* GraphQL */ `
 query HawClubsLegacy($language: String) {
  hawClubs(language: $language) {
   available stale updatedAt sourceUrl
   clubs { id title description sourceUrl links { title url } }
  }
 }
`)

export const ACADEMIC_CALENDAR_QUERY = graphql(/* GraphQL */ `
    query AcademicCalendar {
        academicCalendar {
            available
            stale
            updatedAt
            semesters {
                key
                name { de en }
                events { id name { de en } begin end hasHours }
            }
        }
    }
`)

export const HAW_EVENTS_QUERY = graphql(/* GraphQL */ `
    query HawEvents($language: String!) {
        hawEvents(language: $language) {
            available stale updatedAt truncated sourceUrl managedAvailable
            events { id title origin sourceUrl date endDate dateLabel timeLabel startTime endTime location }
        }
    }
`)

export const HAW_NEWS_QUERY = graphql(/* GraphQL */ `
    query HawNews($language: String!) {
        hawNews(language: $language) {
            available stale updatedAt language sourceUrl
            items { id title url teaser date categories imageUrl imageCredit }
        }
    }
`)

export const CAMPUS_LIFE_QUERY = graphql(/* GraphQL */ `
 query CampusLife {
  campusLifeEvents {
   available
   events { id organizerId organizerName title { de en } description { de en } startDateTime endDateTime location eventUrl }
   organizers { id name description { de en } location website instagram linkedin nonProfit registrationNumber }
  }
 }
`)
