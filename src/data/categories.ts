import { Category } from "@/types";

export const categories: Category[] = [
  {
    id: "dogs", // kept for backward usage in mock
    key: "dogs",
    name: "สุนัข",
    icon: "🐕",
    description: "สุนัขพันธุ์ต่างๆ น่ารักและเป็นมิตร",
  },
  {
    id: "cats",
    key: "cats",
    name: "แมว",
    icon: "🐱",
    description: "แมวน้อยน่ารัก เลี้ยงง่าย",
  },
  {
    id: "birds",
    key: "birds",
    name: "นก",
    icon: "🐦",
    description: "นกสวยงาม เสียงใสไพเราะ",
  },
  {
    id: "food",
    key: "food",
    name: "อาหาร",
    icon: "🍖",
    description: "อาหารสัตว์คุณภาพดี มีครบทุกชนิด",
  },
  {
    id: "toys",
    key: "toys",
    name: "ของเล่น",
    icon: "🎾",
    description: "ของเล่นสัตว์เลี้ยง สนุกสนาน",
  },
];
