package com.mystockfolio.backend.controller;

import com.mystockfolio.backend.client.MarketDataClient;
import com.mystockfolio.backend.client.CrawlerClient;
import com.mystockfolio.backend.dto.MarketDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketController {

    private final MarketDataClient marketDataClient;
    private final CrawlerClient crawlerClient;
    
    // 한국 주식 판별: 6자리 숫자 티커
    private static final Pattern KR_STOCK_PATTERN = Pattern.compile("^\\d{6}$");
    
    private boolean isKoreanStock(String ticker) {
        return ticker != null && KR_STOCK_PATTERN.matcher(ticker).matches();
    }

    @GetMapping("/quote")
    public ResponseEntity<?> getQuote(@RequestParam String ticker) {
        // 한국 주식인 경우 crawler-svc 호출, 그 외는 market-data-svc 호출
        if (isKoreanStock(ticker)) {
            var fromCrawler = crawlerClient.getKRStockQuote(ticker)
                    .<ResponseEntity<?>>map(quote -> {
                        // KRStockQuoteResponse를 DetailedQuoteResponse 형식으로 변환
                        MarketDataDto.DetailedQuoteResponse detailed = MarketDataDto.DetailedQuoteResponse.builder()
                                .ticker(quote.getTicker())
                                .name(quote.getName())
                                .current_price(quote.getCurrent_price())
                                .open_price(quote.getOpen_price())
                                .high_price(quote.getHigh_price())
                                .low_price(quote.getLow_price())
                                .previous_close(quote.getPrevious_close())
                                .volume(quote.getVolume())
                                .change(quote.getChange())
                                .change_percent(quote.getChange_percent())
                                .currency(quote.getCurrency() != null ? quote.getCurrency() : "KRW")
                                .last_updated(java.time.Instant.now().toString())
                                .build();
                        return ResponseEntity.ok(detailed);
                    })
                    .defaultIfEmpty(ResponseEntity.ok(fakeQuote(ticker)))
                    .block();
            return fromCrawler;
        } else {
            // FastAPI 호출
            var fromSvc = marketDataClient.getDetailedQuote(ticker)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .defaultIfEmpty(ResponseEntity.ok(fakeQuote(ticker)))
                    .block();
            return fromSvc;
        }
    }

    @GetMapping("/price")
    public ResponseEntity<?> getPrice(@RequestParam String ticker) {
        log.info("현재가 조회 요청 - ticker: {}", ticker);
        
        // 한국 주식인 경우 crawler-svc 호출, 그 외는 market-data-svc 호출
        if (isKoreanStock(ticker)) {
            var fromCrawler = crawlerClient.getKRStockQuote(ticker)
                    .<ResponseEntity<?>>map(quote -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("ticker", quote.getTicker());
                        response.put("price", quote.getCurrent_price());
                        response.put("last_updated", java.time.Instant.now().toString());
                        return ResponseEntity.ok(response);
                    })
                    .defaultIfEmpty(ResponseEntity.ok(createFakePriceResponse(ticker)))
                    .block();
            return fromCrawler;
        } else {
            // FastAPI 호출
            var fromSvc = marketDataClient.getCurrentPrice(ticker)
                    .<ResponseEntity<?>>map(resp -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("ticker", ticker);
                        response.put("price", resp.getPrice());
                        response.put("last_updated", resp.getLastUpdated() != null ? resp.getLastUpdated() : java.time.Instant.now().toString());
                        return ResponseEntity.ok(response);
                    })
                    .defaultIfEmpty(ResponseEntity.ok(createFakePriceResponse(ticker)))
                    .block();
            return fromSvc;
        }
    }

    @GetMapping("/chart")
    public ResponseEntity<?> getChart(@RequestParam String ticker, @RequestParam(defaultValue = "1mo") String period) {
        return marketDataClient.getHistoricalChart(ticker, period)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.ok(fakeChart(ticker, period)))
                .block();
    }

    @GetMapping("/popular")
    public ResponseEntity<?> getPopular() {
        return marketDataClient.getPopular()
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.ok(fakePopular()))
                .block();
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return marketDataClient.getHealth()
                .<ResponseEntity<?>>map(body -> ResponseEntity.ok(java.util.Map.of("status", "up")))
                .defaultIfEmpty(ResponseEntity.status(503).body(java.util.Map.of("status", "down")))
                .block();
    }

    @GetMapping("/suggest")
    public ResponseEntity<?> suggest(@RequestParam String q) {
        return marketDataClient.suggest(q)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.ok(java.util.List.of()))
                .block();
    }

    @GetMapping("/top")
    public ResponseEntity<?> top(@RequestParam(defaultValue = "gainers") String category) {
        return marketDataClient.top(category)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.ok(fakePopular()))
                .block();
    }

    @GetMapping("/indices")
    public ResponseEntity<?> getIndices() {
        return marketDataClient.getIndices()
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.ok(fakeIndices()))
                .block();
    }

    // ===== Fallback builders (FastAPI 미기동 시 기준) =====
    private MarketDataDto.DetailedQuoteResponse fakeQuote(String ticker) {
        double base = Math.abs(ticker.hashCode() % 500) + 50;
        double change = ((ticker.hashCode() % 200) - 100) / 10.0; // -10 ~ +10
        double current = Math.max(1, base + change);
        double prev = Math.max(1, base);
        double chgPct = (current - prev) / prev * 100.0;
        return MarketDataDto.DetailedQuoteResponse.builder()
                .ticker(ticker.toUpperCase())
                .name(ticker.toUpperCase())
                .current_price(current)
                .open_price(prev)
                .high_price(current * 1.02)
                .low_price(current * 0.98)
                .previous_close(prev)
                .volume(0)
                .market_cap(null)
                .pe_ratio(null)
                .change(current - prev)
                .change_percent(chgPct)
                .currency("USD")
                .last_updated(java.time.Instant.now().toString())
                .build();
    }

    private MarketDataDto.ChartResponse fakeChart(String ticker, String period) {
        List<MarketDataDto.ChartPoint> history = new ArrayList<>();
        double base = Math.abs(ticker.hashCode() % 500) + 50;
        for (int i = 29; i >= 0; i--) {
            LocalDate d = LocalDate.now().minusDays(i);
            double price = base * (1 + (Math.sin((29 - i) / 5.0) * 0.03));
            history.add(new MarketDataDto.ChartPoint(d.toString(), price));
        }
        return new MarketDataDto.ChartResponse(ticker.toUpperCase(), history);
    }

    private List<Map<String, Object>> fakePopular() {
        String[][] seeds = new String[][]{
                {"AAPL", "Apple Inc.", "USD", "stock"},
                {"MSFT", "Microsoft Corporation", "USD", "stock"},
                {"GOOGL", "Alphabet Inc.", "USD", "stock"},
                {"TSLA", "Tesla Inc.", "USD", "stock"},
                {"005930.KS", "Samsung Electronics", "KRW", "stock"},
                {"000660.KS", "SK Hynix", "KRW", "stock"},
                {"BTC-USD", "Bitcoin", "USD", "coin"},
                {"ETH-USD", "Ethereum", "USD", "coin"},
                {"TLT", "iShares 20+ Year Treasury Bond ETF", "USD", "bond"},
                {"SPY", "SPDR S&P 500 ETF Trust", "USD", "etf"}
        };
        List<Map<String, Object>> list = new ArrayList<>();
        for (String[] s : seeds) {
            double base = Math.abs(s[0].hashCode() % 500) + 50;
            double prev = base;
            double current = base * 1.01;
            double chgPct = (current - prev) / prev * 100.0;
            Map<String, Object> m = new HashMap<>();
            m.put("ticker", s[0]);
            m.put("name", s[1]);
            m.put("current_price", current);
            m.put("change_percent", chgPct);
            m.put("currency", s[2]);
            m.put("category", s[3]);
            list.add(m);
        }
        return list;
    }

    private java.util.List<java.util.Map<String, Object>> fakeIndices() {
        java.util.List<java.util.Map<String, Object>> list = new ArrayList<>();
        java.util.Map<String, Object> nasdaq = new java.util.HashMap<>();
        nasdaq.put("symbol", "^IXIC");
        nasdaq.put("name", "나스닥");
        nasdaq.put("display", "NASDAQ");
        nasdaq.put("value", 15000.0);
        nasdaq.put("change_percent", 0.5);
        list.add(nasdaq);

        java.util.Map<String, Object> dow = new java.util.HashMap<>();
        dow.put("symbol", "^DJI");
        dow.put("name", "다우존스");
        dow.put("display", "Dow Jones");
        dow.put("value", 38000.0);
        dow.put("change_percent", -0.2);
        list.add(dow);

        java.util.Map<String, Object> sp500 = new java.util.HashMap<>();
        sp500.put("symbol", "^GSPC");
        sp500.put("name", "S&P 500");
        sp500.put("display", "S&P 500");
        sp500.put("value", 4800.0);
        sp500.put("change_percent", 0.3);
        list.add(sp500);

        java.util.Map<String, Object> kospi = new java.util.HashMap<>();
        kospi.put("symbol", "^KS11");
        kospi.put("name", "코스피");
        kospi.put("display", "KOSPI");
        kospi.put("value", 2500.0);
        kospi.put("change_percent", 0.1);
        list.add(kospi);
        return list;
    }

    private Map<String, Object> createFakePriceResponse(String ticker) {
        Map<String, Object> response = new HashMap<>();
        response.put("ticker", ticker);
        response.put("price", 0.0);
        response.put("last_updated", java.time.Instant.now().toString());
        return response;
    }
}


