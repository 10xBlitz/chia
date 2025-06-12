function Footer() {
  // Footer info variables
  const companyName = "비씨디"; // Company Name: BCD
  const ceoName = "홍준기"; // CEO Name: Junki Hong
  const businessNumber = "235-04-01772"; // Business Registration Number
  const address =
    "경기도 화성시 향남읍 상신하길로 66, 제지1층 제비01호(드림시티)"; // Business Address
  const phone = "010 3757 1495"; // Phone Number
  const commerceNumber = "2025 - 화성향남 0101"; // E-commerce Registration Number

  return (
    <footer className="w-full bg-gray-50 border-t border-b text-[13px] text-gray-600 pt-8 pb-6 px-4 flex flex-col gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg text-[#4285F4]">비씨디</span>
        {/* Company Name: BCD */}
      </div>
      {/* Company Info */}
      <div className="text-[13px] text-gray-600 mt-2 leading-relaxed">
        {/* Only render if info exists */}
        {companyName && (
          <>
            <span>
              <span className="font-semibold">상호명:</span> {companyName}
            </span>
            {/* Company Name */}
            <br />
          </>
        )}
        {ceoName && (
          <>
            <span>
              <span className="font-semibold">대표자명:</span> {ceoName}
            </span>
            {/* CEO Name */}
            <br />
          </>
        )}
        {businessNumber && (
          <>
            <span>
              <span className="font-semibold">사업자등록번호:</span>{" "}
              {businessNumber}
            </span>
            {/* Business Registration Number */}
            <br />
          </>
        )}
        {address && (
          <>
            <span>
              <span className="font-semibold">사업장 주소:</span> {address}
            </span>
            {/* Business Address */}
            <br />
          </>
        )}
        {phone && (
          <>
            <span>
              <span className="font-semibold">유선번호:</span> {phone}
            </span>
            {/* Phone Number */}
            <br />
          </>
        )}
        {commerceNumber && (
          <>
            <span>
              <span className="font-semibold">통신판매업 신고번호:</span>{" "}
              {commerceNumber}
            </span>
            {/* E-commerce Registration Number */}
            <br />
          </>
        )}
      </div>
      {/* Copyright */}
      <div className="text-[12px] text-gray-400 mt-2">
        ©BCD Co.,Ltd. all rights reserved.
        {/* ©BCD Co.,Ltd. all rights reserved. */}
      </div>
    </footer>
  );
}

export default Footer;
