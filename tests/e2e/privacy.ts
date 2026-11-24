// Matches any Indonesian mobile number whatever the separators (+62 8xx-..., 08xx..., 628xx...).
export const MOBILE = /(?:\+?62|\b0)[\s.-]?8\d{2}[\s.-]?\d{3,4}[\s.-]?\d{3,5}/;
