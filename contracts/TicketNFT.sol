// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * TicketNFT (Server-mint / seat duplication guard)
 * - Owner(서버 지갑)만 민팅 가능
 * - (gameId, seatNo) 중복 방지
 * - baseURI + "tokenId.json" 구조로 tokenURI 조합
 * - 이벤트: TicketMinted(to, tokenId, gameId, seatNo)
 */
contract TicketNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId = 1;

    // (gameId, seatNo) -> minted?
    mapping(bytes32 => bool) public seatUsed;

    string private _base; // baseURI

    event TicketMinted(address indexed to, uint256 indexed tokenId, uint256 indexed gameId, string seatNo);

    // OZ 5.x Ownable은 initialOwner를 생성자에서 넘겨야 함
    constructor(string memory name_, string memory symbol_, string memory baseURI_, address initialOwner)
        ERC721(name_, symbol_)
        Ownable(initialOwner)
    {
        _base = baseURI_;
    }

    function setBaseURI(string calldata newBase) external onlyOwner {
        _base = newBase;
    }

    function _baseURI() internal view override returns (string memory) {
        return _base;
    }

    /**
     * 서버(Owner)만 호출 가능: 좌석 NFT 민팅
     * - 저장되는 tokenURI 값에는 "파일명"만 넣는다(예: "1.json")
     *   최종 tokenURI()는 baseURI + 파일명으로 합쳐져 반환됨.
     */
    function mintTicket(address to, uint256 gameId, string calldata seatNo)
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        bytes32 seatKey = keccak256(abi.encodePacked(gameId, seatNo));
        require(!seatUsed[seatKey], "Seat already minted");

        tokenId = _nextTokenId++;
        seatUsed[seatKey] = true;

        _safeMint(to, tokenId);

        // ✅ 여기서는 파일명만 저장 (중복 방지)
        _setTokenURI(tokenId, string(abi.encodePacked(_toString(tokenId), ".json")));

        emit TicketMinted(to, tokenId, gameId, seatNo);
    }

    // 간단 uint256 -> string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
