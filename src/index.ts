"use strict";

import Axios, { AxiosResponse } from "axios";
import Cheerio from "cheerio";
import Moment from "moment";
import SanitizeHTML from "sanitize-html";

import { NewsEntries } from "./interfaces/news-entries";

async function getMCBBSNews(): Promise<void> {

    const response: AxiosResponse<string> = await Axios.get("https://www.mcbbs.net/forum-news-1.html", {
        responseType: "text",
    });

    const source: CheerioStatic = Cheerio.load(response.data);
    const table: string = source("#threadlisttableid").parent().html();
    //console.log(table);

    let isByAfterNum: boolean = false;
    const sanitized: string = SanitizeHTML(table, {
        allowedTags: [
            "a", "em", "span", "table", "tbody", "td", "th", "tr",
        ],
        allowedAttributes: {
            "*": ["class", "id"],
            "a": ["href"],
            "span": ["title"],
        },
        exclusiveFilter: ({ attribs, tag }): boolean => {

            switch (tag) {
                case "a":
                    if (typeof attribs["class"] === "string") {
                        return attribs["class"].split(" ").some((value): boolean => {
                            return ["showcontent", "tdpre", "xi1"].includes(value);
                        });
                    } else { return false; }

                case "span":
                    if (typeof attribs["class"] === "string") {
                        return attribs["class"].split(" ").some((value): boolean => {
                            return ["tps"].includes(value);
                        });
                    } else { return false; }

                case "tbody":
                    return (typeof attribs["id"] === "string")
                        && (attribs["id"].startsWith("stickthread_") || (attribs["id"] === "separatorline"));

                case "td":
                    if (typeof attribs["class"] === "string") {
                        const classes: string[] = attribs["class"].split(" ")
                        if (classes.includes("by")) {
                            const temp: boolean = isByAfterNum;
                            isByAfterNum = false;

                            return temp;
                        } else {
                            if (classes.includes("num")) { isByAfterNum = true; }

                            return classes.some((value): boolean => {
                                return ["icn", "num"].includes(value);
                            });
                        }
                    } else { return false; }

                default:
                    return false;
            }
        },
    });
    //console.log(sanitized);

    const news: NewsEntries = [];

    const document: CheerioStatic = Cheerio.load(sanitized);
    document("tbody").each((index, element): void => {
        const thread: CheerioStatic = Cheerio.load(`<table>${ Cheerio.html(element, { decodeEntities: false }) }</table>`);

        news.push({
            title: thread("th > a").text(),
            category: thread("th > em > a").text(),
            time: Moment((typeof thread("td.by > em > span").attr()["title"] === "string") ? thread("td.by > em > span").attr()["title"] : thread("td.by > em > span").text(), ["YYYY-M-D"]).toDate(),
            url: new URL(thread("th > a").attr()["href"], "https://www.mcbbs.net/forum-news-1.html"),
        });
    });

    console.log(news);
}

getMCBBSNews();
