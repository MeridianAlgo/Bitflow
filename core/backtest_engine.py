import pandas as pd
import numpy as np
import os
from datetime import datetime
import math

# Example usage: python core/backtest_engine.py data/BTCUSD_5min.csv BTCUSD
# CSV must have columns: date,open,high,low,close,volume

def load_data(csv_path):
    df = pd.read_csv(csv_path, parse_dates=['date'])
    return df

def calculate_sma(series, period):
    return series.rolling(window=period).mean()

def calculate_ema(series, period):
    return series.ewm(span=period, adjust=False).mean()

def calculate_rsi(series, period=14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / (loss + 1e-10)
    rsi = 100 - (100 / (1 + rs))
    return rsi

def get_gemini_position_sizing(entry_price, balance, risk_pct=1.0):
    """
    Risk-based position sizing that rounds to the nearest hundred units.
    """
    if entry_price is None or entry_price <= 0:
        return 100

    if balance is None or balance <= 0:
        balance = 0

    risk_pct = max(risk_pct, 0)
    risk_amount = balance * (risk_pct / 100.0)
    raw_size = risk_amount / entry_price if entry_price else 0
    raw_size = max(raw_size, 1)
    rounded_size = int(math.ceil(raw_size / 100.0) * 100)
    return max(rounded_size, 100)


def get_gemini_pl_percentage(entry_price, exit_price):
    """
    Calculate profit or loss percentage locally.
    """
    if entry_price is None or entry_price == 0:
        return 0.0

    pnl_pct = (exit_price - entry_price) / entry_price * 100.0
    return round(pnl_pct, 2)

def backtest(df, symbol, base_length=20, vol_scale=10, rsi_period=14, tp=1, sl=1, balance=10000):
    positions = []
    in_position = False
    entry_idx = None
    entry_date = None
    position_size = None
    reason = None
    for i in range(1, len(df)):
        close = df['close']
        date = df['date']
        # Momentum-based entry: Buy if current close > previous close
        if not in_position and close.iloc[i] > close.iloc[i-1]:
            in_position = True
            entry_idx = i
            entry_price = close.iloc[i]
            entry_date = date.iloc[i]
            # Get position size from Gemini AI
            position_size = get_gemini_position_sizing(entry_price, balance)
            continue
        # Exit logic (TP/SL or next down tick)
        if in_position:
            exit_price = close.iloc[i]
            exit_date = date.iloc[i]
            # Get P/L percentage from Gemini AI
            pnl_pct = get_gemini_pl_percentage(entry_price, exit_price)
            pnl = (exit_price - entry_price) * position_size
            # Take profit/stop loss
            if pnl_pct >= tp:
                reason = 'Take Profit Hit'
            elif pnl_pct <= -sl:
                reason = 'Stop Loss Hit'
            elif close.iloc[i] < close.iloc[i-1]:
                reason = 'Momentum Loss (Down Tick)'
            else:
                reason = None
            if reason:
                position = {
                    'symbol': symbol,
                    'entry_price': entry_price,
                    'entry_date': entry_date,
                    'exit_price': exit_price,
                    'exit_date': exit_date,
                    'position_size': position_size,
                    'pnl': pnl,
                    'pnl_pct': pnl_pct,
                    'reason': reason
                }
                positions.append(position)
                save_positions([position], out_path='positions_sold.csv')
                in_position = False
                entry_idx = None
                entry_price = None
                entry_date = None
                position_size = None
                reason = None
    return positions

def save_positions(positions, out_path='logs/backtest_results/positions_sold.csv'):
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    df = pd.DataFrame(positions)
    if os.path.exists(out_path):
        df_existing = pd.read_csv(out_path)
        df = pd.concat([df_existing, df], ignore_index=True)
    df.to_csv(out_path, index=False)
    print(f'Positions saved to {out_path}')

def load_positions(out_path='positions_sold.csv'):
    if not os.path.exists(out_path):
        print('No positions file found.')
        return
    df = pd.read_csv(out_path)
    print(df.tail(10))

def batch_backtest(directory):
    all_results = []
    all_symbols = []
    for fname in os.listdir(directory):
        if fname.endswith('.csv'):
            symbol = os.path.splitext(fname)[0]
            csv_path = os.path.join(directory, fname)
            print(f'\n=== Backtesting {symbol} ===')
            df = load_data(csv_path)
            results = backtest(df, symbol)
            out_path = f'backtest_results_{symbol}.csv'
            pd.DataFrame(results).to_csv(out_path, index=False)
            print(f'Backtest complete. Results saved to {out_path}')
            save_positions(results, out_path=f'positions_sold_{symbol}.csv')
            all_results.extend(results)
            all_symbols.append(symbol)
    # Save master file
    pd.DataFrame(all_results).to_csv('backtest_results_all.csv', index=False)
    print(f'All results saved to backtest_results_all.csv')
    print(f'Processed symbols: {all_symbols}')

if __name__ == '__main__':
    import sys
    if len(sys.argv) == 2 and os.path.isdir(sys.argv[1]):
        batch_backtest(sys.argv[1])
    elif len(sys.argv) >= 3:
        df = load_data(sys.argv[1])
        symbol = sys.argv[2]
        results = backtest(df, symbol)
        out_path = 'backtest_results.csv'
        pd.DataFrame(results).to_csv(out_path, index=False)
        print(f'Backtest complete. Results saved to {out_path}')
        save_positions(results)
        print('Last 10 sold positions:')
        load_positions()
    else:
        print('Usage: python core/backtest_engine.py <csv_file> <symbol> OR python core/backtest_engine.py <directory_of_csvs>')