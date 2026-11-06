"""IP Intelligence and Geolocation enrichment service for CyberWatch Phase 4."""

from datetime import datetime, timezone
import ipaddress
import re
from typing import Any

from app.schemas.intelligence import IPIntelligenceSchema, IPType, ReputationStatus

# Well-known public infrastructure and threat ranges
KNOWN_IP_DATABASE: dict[str, dict[str, Any]] = {
    "1.1.1.1": {
        "country_code": "US",
        "country_name": "United States",
        "city": "San Francisco",
        "asn": "AS13335",
        "organization": "Cloudflare, Inc. (1.1.1.1 DNS Resolver)",
        "threat_score": 0,
        "reputation": ReputationStatus.CLEAN,
        "flags": ["Public DNS", "Anycast CDN"],
    },
    "8.8.8.8": {
        "country_code": "US",
        "country_name": "United States",
        "city": "Mountain View",
        "asn": "AS15169",
        "organization": "Google LLC (Google Public DNS)",
        "threat_score": 0,
        "reputation": ReputationStatus.CLEAN,
        "flags": ["Public DNS", "Google Infrastructure"],
    },
    "8.8.4.4": {
        "country_code": "US",
        "country_name": "United States",
        "city": "Mountain View",
        "asn": "AS15169",
        "organization": "Google LLC",
        "threat_score": 0,
        "reputation": ReputationStatus.CLEAN,
        "flags": ["Public DNS"],
    },
    "198.51.100.25": {
        "country_code": "RU",
        "country_name": "Russian Federation",
        "city": "Saint Petersburg",
        "asn": "AS49505",
        "organization": "Known Command & Control Infrastructure",
        "threat_score": 95,
        "reputation": ReputationStatus.MALICIOUS,
        "flags": ["Malware C2", "Metasploit Receiver", "AbuseIPDB Confirmed"],
    },
    "203.0.113.88": {
        "country_code": "CN",
        "country_name": "China",
        "city": "Shenzhen",
        "asn": "AS4134",
        "organization": "Suspicious Scanning Host",
        "threat_score": 88,
        "reputation": ReputationStatus.MALICIOUS,
        "flags": ["Port Scanner", "Brute Force Source"],
    },
    "185.220.101.5": {
        "country_code": "DE",
        "country_name": "Germany",
        "city": "Frankfurt",
        "asn": "AS60729",
        "organization": "Tor Project Exit Node",
        "threat_score": 80,
        "reputation": ReputationStatus.SUSPICIOUS,
        "flags": ["Tor Exit Node", "Anonymization Proxy"],
    },
}


class IPIntelligenceService:
    """Classifies, geolocates, and scores risk for network endpoints."""

    def __init__(self) -> None:
        self._cache: dict[str, IPIntelligenceSchema] = {}

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def analyze_ip(self, ip_str: str) -> IPIntelligenceSchema:
        """Enrich an IP address with classification, geo-location, ASN, and threat score."""
        ip_clean = ip_str.strip()
        if ip_clean in self._cache:
            return self._cache[ip_clean]

        # Check known mock database first
        if ip_clean in KNOWN_IP_DATABASE:
            data = KNOWN_IP_DATABASE[ip_clean]
            intel = IPIntelligenceSchema(
                ip=ip_clean,
                ip_type=IPType.PUBLIC,
                is_private=False,
                country_code=data["country_code"],
                country_name=data["country_name"],
                city=data["city"],
                asn=data["asn"],
                organization=data["organization"],
                threat_score=data["threat_score"],
                reputation=data["reputation"],
                flags=data["flags"],
                last_analyzed=self._now_iso(),
            )
            self._cache[ip_clean] = intel
            return intel

        # Parse standard IP structure
        try:
            ip_obj = ipaddress.ip_address(ip_clean)
        except ValueError:
            # Not a valid IP format
            return IPIntelligenceSchema(
                ip=ip_clean,
                ip_type=IPType.PUBLIC,
                is_private=False,
                threat_score=50,
                reputation=ReputationStatus.UNKNOWN,
                flags=["Unparseable IP"],
                last_analyzed=self._now_iso(),
            )

        now = self._now_iso()

        if ip_obj.is_loopback:
            intel = IPIntelligenceSchema(
                ip=ip_clean,
                ip_type=IPType.LOOPBACK,
                is_private=True,
                country_code="LOC",
                country_name="Localhost Loopback",
                city="Local System",
                asn="INTERNAL",
                organization="Host Local Loopback Device",
                threat_score=0,
                reputation=ReputationStatus.CLEAN,
                flags=["Loopback", "Internal Sockets"],
                last_analyzed=now,
            )
        elif ip_obj.is_private:
            intel = IPIntelligenceSchema(
                ip=ip_clean,
                ip_type=IPType.PRIVATE,
                is_private=True,
                country_code="PRI",
                country_name="Private Local Network",
                city="Internal Subnet",
                asn="RFC-1918",
                organization="Local Area Network / Intranet",
                threat_score=5,
                reputation=ReputationStatus.CLEAN,
                flags=["Private Subnet", "RFC 1918"],
                last_analyzed=now,
            )
        elif ip_obj.is_multicast:
            intel = IPIntelligenceSchema(
                ip=ip_clean,
                ip_type=IPType.MULTICAST,
                is_private=False,
                country_code="MCAST",
                country_name="Multicast Group",
                city=None,
                asn="MCAST",
                organization="Multicast Routing",
                threat_score=0,
                reputation=ReputationStatus.CLEAN,
                flags=["Multicast"],
                last_analyzed=now,
            )
        else:
            # Deterministic heuristic mapping for public internet IPs
            octets = ip_clean.split(".")
            first_octet = int(octets[0]) if len(octets) == 4 and octets[0].isdigit() else 100

            if first_octet in (13, 52, 54):
                org = "Amazon Web Services (AWS)"
                asn = "AS16509"
                country = ("US", "United States", "Ashburn")
                score = 5
                rep = ReputationStatus.CLEAN
                flags = ["Cloud Provider", "AWS Cloud"]
            elif first_octet in (20, 40):
                org = "Microsoft Corporation (Azure)"
                asn = "AS8075"
                country = ("US", "United States", "Redmond")
                score = 5
                rep = ReputationStatus.CLEAN
                flags = ["Cloud Provider", "Azure"]
            elif first_octet in (104, 172):
                org = "Cloudflare Network"
                asn = "AS13335"
                country = ("US", "United States", "San Jose")
                score = 10
                rep = ReputationStatus.CLEAN
                flags = ["CDN / Edge Proxy"]
            elif first_octet in (142, 173):
                org = "Google Cloud Infrastructure"
                asn = "AS15169"
                country = ("US", "United States", "Mountain View")
                score = 5
                rep = ReputationStatus.CLEAN
                flags = ["Google Service"]
            else:
                org = f"Autonomous Network Provider (AS{first_octet * 123})"
                asn = f"AS{first_octet * 123}"
                country = ("US", "United States", "New York")
                score = 25
                rep = ReputationStatus.CLEAN
                flags = ["Public Internet"]

            intel = IPIntelligenceSchema(
                ip=ip_clean,
                ip_type=IPType.PUBLIC,
                is_private=False,
                country_code=country[0],
                country_name=country[1],
                city=country[2],
                asn=asn,
                organization=org,
                threat_score=score,
                reputation=rep,
                flags=flags,
                last_analyzed=now,
            )

        self._cache[ip_clean] = intel
        return intel

    def batch_analyze(self, ips: list[str]) -> dict[str, IPIntelligenceSchema]:
        """Analyze a list of IP addresses in bulk."""
        results: dict[str, IPIntelligenceSchema] = {}
        for ip in ips:
            if ip:
                results[ip] = self.analyze_ip(ip)
        return results


ip_intelligence_service = IPIntelligenceService()
