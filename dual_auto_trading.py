import requests
import json
import time
import datetime
import pandas as pd
import yfinance as yf
import logging
import os

# --- [1] 로깅 및 보안 설정 ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.FileHandler("trading_log.txt"), logging.StreamHandler()]
)

# 보안을 위해 환경변수 또는 별도 파일 권장
CONFIG = {
    "APP_KEY": "YOUR_APP_KEY",
    "APP_SECRET": "YOUR_APP_SECRET",
    "CANO": "YOUR_ACCOUNT_NUMBER", # 계좌번호 8자리
    "URL_BASE": "https://openapi.koreainvestment.com:9443", # 실전용
}

TARGETS = {
    "005930": {"name": "삼성전자", "tp": 0.015, "sl": -0.008, "be_trigger": 0.012},
    "000660": {"name": "SK하이닉스", "tp": 0.018, "sl": -0.008, "be_trigger": 0.012}
}

class KISQuantBot:
    def __init__(self):
        self.token = ""
        self.positions = self.load_positions()
        self.trackers = {code: {"step": 0, "b1": 0, "last_time": None} for code in TARGETS}
        self.trade_ready = False

    def load_positions(self):
        if os.path.exists("positions.json"):
            with open("positions.json", "r") as f:
                return json.load(f)
        return {}

    def save_positions(self):
        with open("positions.json", "w") as f:
            json.dump(self.positions, f)

    def get_token(self):
        """액세스 토큰 발급"""
        url = f"{CONFIG['URL_BASE']}/oauth2/tokenP"
        body = {"grant_type": "client_credentials", "appkey": CONFIG['APP_KEY'], "secretkey": CONFIG['APP_SECRET']}
        res = requests.post(url, data=json.dumps(body))
        self.token = res.json()['access_token']
        logging.info("새로운 액세스 토큰이 발급되었습니다.")

    def check_macro(self):
        """거시지표 필터: 나스닥, 반도체지수, 엔비디아 -1.5% 룰"""
        tickers = ["^IXIC", "^SOX", "NVDA"]
        data = yf.download(tickers, period="2d", progress=False)['Close']
        changes = (data.iloc[-1] / data.iloc[-2]) - 1
        
        if any(changes <= -0.015):
            logging.warning(f"거시 필터 탈락: {changes.to_dict()}")
            return False
        logging.info("거시 필터 통과. 오늘 매매를 진행합니다.")
        return True

    def calculate_wr(self, df, period=10):
        high_h = df['high'].rolling(window=period).max()
        low_l = df['low'].rolling(window=period).min()
        return (high_h - df['close']) / (high_h - low_l) * -100

    def pattern_check(self, code, wr_val):
        """쌍바닥 정밀 수치 검증"""
        tracker = self.trackers[code]
        
        # Step 1: Bottom 1 (-85 이하)
        if tracker['step'] == 0 and wr_val <= -85:
            tracker['step'] = 1
            logging.info(f"[{TARGETS[code]['name']}] Step 1: 첫 번째 바닥 포착 ({wr_val:.2f})")
        
        # Step 2: Rebound (-50 이상)
        elif tracker['step'] == 1 and wr_val >= -50:
            tracker['step'] = 2
            logging.info(f"[{TARGETS[code]['name']}] Step 2: 반등 확인")
            
        # Step 3: Bottom 2 (-84 ~ -80) & Trigger (-78 상향돌파)
        elif tracker['step'] == 2:
            if -84 <= wr_val <= -80:
                tracker['step'] = 3
                logging.info(f"[{TARGETS[code]['name']}] Step 3: 쌍바닥 완성 중")
        
        elif tracker['step'] == 3 and wr_val >= -78:
            tracker['step'] = 0 # 초기화
            return True
            
        return False

    def execute_trade(self):
        """메인 매매 루프"""
        self.get_token()
        self.trade_ready = self.check_macro()
        
        if not self.trade_ready: return

        while True:
            now = datetime.datetime.now()
            
            # 장 마감 15:10 강제 청산
            if now.hour == 15 and now.minute >= 10:
                self.liquidate_all()
                break

            # 09:10 ~ 15:00 사이 작동
            if (now.hour == 9 and now.minute >= 10) or (10 <= now.hour < 15):
                for code in TARGETS:
                    # [주의] 아래는 KIS API 실시간 시세/분봉 조회 함수로 대체되어야 함
                    # df = self.fetch_kis_ohlcv(code) 
                    # curr_price = df['close'].iloc[-1]
                    # wr = self.calculate_wr(df).iloc[-1]

                    # 1. 매수 로직
                    if code not in self.positions:
                        if self.pattern_check(code, wr):
                            logging.info(f"🚀 [{TARGETS[code]['name']}] 매수 신호 발생! 주문 전송.")
                            # self.send_kis_order(code, "BUY")
                            self.positions[code] = {"entry": curr_price, "be": False}
                            self.save_positions()

                    # 2. 매도 로직
                    else:
                        ret = (curr_price / self.positions[code]['entry']) - 1
                        params = TARGETS[code]
                        
                        if ret >= params['be_trigger']:
                            self.positions[code]['be'] = True
                        
                        sl_limit = 0.001 if self.positions[code]['be'] else params['sl']
                        
                        if ret >= params['tp'] or ret <= sl_limit:
                            logging.info(f"💰 [{params['name']}] 청산 실행 (수익률: {ret:.2%})")
                            # self.send_kis_order(code, "SELL")
                            del self.positions[code]
                            self.save_positions()

            time.sleep(60) # 1분 단위 체크

    def liquidate_all(self):
        logging.info("장 마감. 모든 포지션을 정리합니다.")
        # 모든 self.positions에 대해 SELL 주문 실행 로직

if __name__ == "__main__":
    bot = KISQuantBot()
    bot.execute_trade()
