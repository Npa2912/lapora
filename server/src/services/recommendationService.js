const Product = require("../models/Product");

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getNumberFromText(value = "") {
  const match = String(value).match(/(\d+)/);

  return match ? Number(match[1]) : 0;
}

function getRamGB(product) {
  return getNumberFromText(product.specs?.ram);
}

function getStorageGB(product) {
  return getNumberFromText(product.specs?.storage);
}

function getCpuLevel(product) {
  const cpu = normalizeText(product.specs?.cpu);

  if (
    cpu.includes("core ultra 9") ||
    cpu.includes("core i9") ||
    cpu.includes("ryzen 9") ||
    cpu.includes("apple m4 pro") ||
    cpu.includes("apple m3 pro")
  ) {
    return 5;
  }

  if (
    cpu.includes("core ultra 7") ||
    cpu.includes("core i7") ||
    cpu.includes("ryzen 7") ||
    cpu.includes("apple m4") ||
    cpu.includes("apple m3")
  ) {
    return 4;
  }

  if (
    cpu.includes("core ultra 5") ||
    cpu.includes("core i5") ||
    cpu.includes("ryzen 5") ||
    cpu.includes("apple m2")
  ) {
    return 3;
  }

  if (cpu.includes("core i3") || cpu.includes("ryzen 3")) {
    return 1;
  }

  return 2;
}

function hasDedicatedGpu(product) {
  const gpuText = normalizeText(
    `${product.specs?.gpu || ""} ${product.description || ""}`
  );

  return (
    gpuText.includes("rtx") ||
    gpuText.includes("gtx") ||
    gpuText.includes("radeon rx") ||
    gpuText.includes("arc a")
  );
}

function isLightLaptop(product) {
  const portability = normalizeText(product.advice?.portability);
  const weight = getNumberFromText(product.specs?.weight);

  return (
    portability === "rat nhe" ||
    portability === "nhe" ||
    (weight > 0 && weight <= 1.6)
  );
}

function getPurposes(profile = {}) {
  const rawPurposes = Array.isArray(profile.purposes)
    ? profile.purposes
    : [profile.purpose || "general"];

  return rawPurposes.map(normalizeText);
}

function hasPurpose(purposes, keyword) {
  return purposes.some((purpose) => purpose.includes(keyword));
}

function containsAny(text, keywords) {
  const normalized = normalizeText(text);

  return keywords.some((keyword) => normalized.includes(keyword));
}

function getAdviceMatchScore(product, purposes) {
  const suitableFor = product.advice?.suitableFor || [];
  const notIdealFor = product.advice?.notIdealFor || [];

  let score = 0;

  for (const purpose of purposes) {
    if (
      suitableFor.some((item) =>
        normalizeText(item).includes(normalizeText(purpose))
      )
    ) {
      score += 10;
    }

    if (
      notIdealFor.some((item) =>
        normalizeText(item).includes(normalizeText(purpose))
      )
    ) {
      score -= 15;
    }
  }

  return score;
}

function getPriceScore(product, maxPrice) {
  if (!maxPrice) {
    return {
      score: 8,
      priceStatus: "Chưa có ngân sách cụ thể",
    };
  }

  if (product.price <= maxPrice) {
    // Máy càng gần ngân sách mà vẫn đủ nhu cầu càng đáng cân nhắc.
    const ratio = product.price / maxPrice;

    return {
      score: ratio >= 0.65 ? 22 : 16,
      priceStatus: "Trong ngân sách",
    };
  }

  if (product.price <= maxPrice * 1.12) {
    return {
      score: 5,
      priceStatus: "Vượt ngân sách nhẹ",
    };
  }

  return {
    score: -18,
    priceStatus: "Vượt ngân sách",
  };
}

function scoreProduct(product, profile = {}) {
  const purposes = getPurposes(profile);

  const isProgramming =
    hasPurpose(purposes, "program") ||
    hasPurpose(purposes, "lap trinh") ||
    hasPurpose(purposes, "cntt") ||
    hasPurpose(purposes, "it");

  const isOffice =
    hasPurpose(purposes, "office") ||
    hasPurpose(purposes, "van phong");

  const isGaming =
    hasPurpose(purposes, "gaming") || hasPurpose(purposes, "game");

  const isDesign =
    hasPurpose(purposes, "design") ||
    hasPurpose(purposes, "do hoa") ||
    hasPurpose(purposes, "render") ||
    hasPurpose(purposes, "video");

  const isStudent =
    hasPurpose(purposes, "student") ||
    hasPurpose(purposes, "sinh vien") ||
    hasPurpose(purposes, "hoc tap");

  const ramGB = getRamGB(product);
  const storageGB = getStorageGB(product);
  const cpuLevel = getCpuLevel(product);
  const dedicatedGpu = hasDedicatedGpu(product);
  const maxPrice = Number(profile.maxPrice) || 0;

  const reasons = [];
  const considerations = [];
  let score = 0;

  const priceInfo = getPriceScore(product, maxPrice);
  score += priceInfo.score;

  // Độ tin cậy chung của sản phẩm.
  score += Math.min(Number(product.rating || 0) * 2, 10);

  if (isProgramming) {
    if (ramGB >= 16) {
      score += 24;
      reasons.push("RAM 16GB phù hợp để code và mở nhiều ứng dụng");
    } else if (ramGB >= 8) {
      score += 10;
      considerations.push(
        "RAM 8GB dùng tốt cho lập trình cơ bản nhưng sẽ hạn chế khi chạy Docker hoặc máy ảo"
      );
    } else {
      score -= 14;
      considerations.push("RAM thấp, không phù hợp để dùng lâu dài cho lập trình");
    }

    if (cpuLevel >= 3) {
      score += 16;
      reasons.push("CPU đủ khỏe cho lập trình và xử lý đa nhiệm");
    } else {
      score += 3;
      considerations.push("CPU phù hợp nhu cầu cơ bản hơn là tác vụ nặng");
    }

    if (storageGB >= 512) {
      score += 8;
      reasons.push("SSD 512GB thoải mái hơn cho phần mềm và tài liệu học tập");
    } else {
      considerations.push("Dung lượng lưu trữ có thể nhanh đầy khi cài nhiều công cụ");
    }
  }

  if (isOffice) {
    if (ramGB >= 8) {
      score += 16;
      reasons.push("Đủ mượt cho Office, họp trực tuyến và đa nhiệm hằng ngày");
    }

    if (isLightLaptop(product)) {
      score += 10;
      reasons.push("Thiết kế gọn nhẹ, tiện mang đi");
    }
  }

  if (isGaming) {
    if (dedicatedGpu) {
      score += 28;
      reasons.push("Có card đồ họa rời, phù hợp chơi game tốt hơn");
    } else {
      score -= 18;
      considerations.push(
        "Không có card đồ họa rời, chỉ nên chơi game nhẹ hoặc eSports"
      );
    }

    if (ramGB >= 16) {
      score += 12;
    }

    if (cpuLevel >= 3) {
      score += 10;
    }
  }

  if (isDesign) {
    if (dedicatedGpu) {
      score += 22;
      reasons.push("Card đồ họa rời hỗ trợ tốt hơn cho đồ họa và render");
    } else {
      considerations.push(
        "Phù hợp thiết kế cơ bản, không lý tưởng cho render 3D nặng"
      );
    }

    if (ramGB >= 16) {
      score += 15;
      reasons.push("RAM 16GB hỗ trợ xử lý ảnh và đa nhiệm tốt hơn");
    }

    if (containsAny(product.specs?.screen, ["oled", "100% srgb", "2.5k", "2.8k", "3k"])) {
      score += 10;
      reasons.push("Màn hình có chất lượng hiển thị tốt hơn cho thiết kế");
    }
  }

  if (isStudent && isLightLaptop(product)) {
    score += 12;

    if (!reasons.some((reason) => reason.includes("gọn nhẹ"))) {
      reasons.push("Dễ mang theo khi đi học");
    }
  }

  if (profile.portability === "high" && isLightLaptop(product)) {
    score += 14;
  }

  if (profile.futureProof === "high") {
    if (ramGB >= 16) {
      score += 12;
    }

    if (storageGB >= 512) {
      score += 6;
    }

    if (product.advice?.expectedUseYears >= 4) {
      score += 8;
    }
  }

  score += getAdviceMatchScore(product, purposes);

  // Dùng dữ liệu tư vấn nhập thủ công nếu sản phẩm đã có.
  for (const strength of product.advice?.strengths || []) {
    if (reasons.length < 3) {
      reasons.push(strength);
    }
  }

  for (const limitation of product.advice?.limitations || []) {
    if (considerations.length < 2) {
      considerations.push(limitation);
    }
  }

  if (!reasons.length) {
    reasons.push("Cấu hình cân bằng cho nhu cầu sử dụng hằng ngày");
  }

  return {
    ...product,
    recommendation: {
      score,
      priceStatus: priceInfo.priceStatus,
      reasons: reasons.slice(0, 3),
      considerations: considerations.slice(0, 2),
    },
  };
}

function getRecommendationLabel(product, index, maxPrice) {
  const score = product.recommendation.score;
  const priceStatus = product.recommendation.priceStatus;

  if (index === 0 && priceStatus === "Trong ngân sách") {
    return "AI đề xuất";
  }

  if (priceStatus === "Vượt ngân sách nhẹ") {
    return "Đầu tư thêm để dùng lâu hơn";
  }

  if (score >= 45) {
    return "Đủ dùng và tiết kiệm";
  }

  return "Lựa chọn tham khảo";
}

async function recommendLaptops(profile = {}) {
  const query = {
    stock: { $gt: 0 },
  };

  // Chỉ lọc category nếu AI thực sự chắc chắn.
  if (profile.category) {
    query.category = profile.category;
  }

  const candidates = await Product.find(query)
    .select(
      "name slug brand category price oldPrice images specs stock rating description advice"
    )
    .sort({ price: 1 })
    .limit(40)
    .lean();

  const rankedProducts = candidates
    .map((product) => scoreProduct(product, profile))
    .sort(
      (firstProduct, secondProduct) =>
        secondProduct.recommendation.score -
        firstProduct.recommendation.score
    )
    .slice(0, 4)
    .map((product, index) => ({
      ...product,
      recommendation: {
        ...product.recommendation,
        label: getRecommendationLabel(
          product,
          index,
          Number(profile.maxPrice) || 0
        ),
      },
    }));

  return {
    primary: rankedProducts[0] || null,
    products: rankedProducts,
  };
}

module.exports = {
  recommendLaptops,
};