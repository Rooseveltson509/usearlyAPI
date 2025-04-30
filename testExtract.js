import { service as siteService } from "./services/siteService.js";

async function testUrls(urls) {
  for (const url of urls) {
    try {
      const { bugLocation, categories } =
        await siteService.extractBugLocationAndCategories(url);
      console.log(`🌍 URL: ${url}`);
      console.log(`✅ Bug Location: ${bugLocation}`);
      console.log(`🏷️ Categories: ${categories.join(", ")}`);
    } catch (error) {
      console.error(`❌ Erreur pour l'URL : ${url}`);
      console.error(error);
    }
    console.log("---------------------------------------------------\n");
  }
}

const urlsToTest = [
  "https://www.laboutiqueofficielle.com",
  "https://decathlon.customers.evy.eu/fr/contracts",
  "https://www.amazon.fr/gp/help/customer/display.html",
  "https://www.linkedin.com/in/someuser",
  "https://www.github.com/user/project",
  "https://www.airbnb.fr/rooms/12345678",
  "https://www.linkedin.com/feed/",
  "https://www.amazon.fr/Amazon-Basics-bandelettes-capacit%C3%A9-feuilles/dp/B0C6PWGLCB?ref=...",
  "https://www.temu.com/fr/4-8-lampes-de-sol-extérieures-...",
];

testUrls(urlsToTest);
