"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const axios_1 = tslib_1.__importDefault(require("axios"));
const cheerio_1 = tslib_1.__importDefault(require("cheerio"));
const moment_1 = tslib_1.__importDefault(require("moment"));
const sanitize_html_1 = tslib_1.__importDefault(require("sanitize-html"));
function getMCBBSNews() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get("https://www.mcbbs.net/forum-news-1.html", {
            responseType: "text",
        });
        const source = cheerio_1.default.load(response.data);
        const table = source("#threadlisttableid").parent().html();
        let isByAfterNum = false;
        const sanitized = sanitize_html_1.default(table, {
            allowedTags: [
                "a", "em", "span", "table", "tbody", "td", "th", "tr",
            ],
            allowedAttributes: {
                "*": ["class", "id"],
                "a": ["href"],
                "span": ["title"],
            },
            exclusiveFilter: ({ attribs, tag }) => {
                switch (tag) {
                    case "a":
                        if (typeof attribs["class"] === "string") {
                            return attribs["class"].split(" ").some((value) => {
                                return ["showcontent", "tdpre", "xi1"].includes(value);
                            });
                        }
                        else {
                            return false;
                        }
                    case "span":
                        if (typeof attribs["class"] === "string") {
                            return attribs["class"].split(" ").some((value) => {
                                return ["tps"].includes(value);
                            });
                        }
                        else {
                            return false;
                        }
                    case "tbody":
                        return (typeof attribs["id"] === "string")
                            && (attribs["id"].startsWith("stickthread_") || (attribs["id"] === "separatorline"));
                    case "td":
                        if (typeof attribs["class"] === "string") {
                            const classes = attribs["class"].split(" ");
                            if (classes.includes("by")) {
                                const temp = isByAfterNum;
                                isByAfterNum = false;
                                return temp;
                            }
                            else {
                                if (classes.includes("num")) {
                                    isByAfterNum = true;
                                }
                                return classes.some((value) => {
                                    return ["icn", "num"].includes(value);
                                });
                            }
                        }
                        else {
                            return false;
                        }
                    default:
                        return false;
                }
            },
        });
        const news = [];
        const document = cheerio_1.default.load(sanitized);
        document("tbody").each((index, element) => {
            const thread = cheerio_1.default.load(`<table>${cheerio_1.default.html(element, { decodeEntities: false })}</table>`);
            news.push({
                title: thread("th > a").text(),
                category: thread("th > em > a").text(),
                time: moment_1.default((typeof thread("td.by > em > span").attr()["title"] === "string") ? thread("td.by > em > span").attr()["title"] : thread("td.by > em > span").text(), ["YYYY-M-D"]).toDate(),
                url: new URL(thread("th > a").attr()["href"], "https://www.mcbbs.net/forum-news-1.html"),
            });
        });
        console.log(news);
    });
}
getMCBBSNews();
