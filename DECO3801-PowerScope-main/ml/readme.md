# Daily Energy Forecast LSTM Model

This project contains an LSTM-based machine learning model for forecasting **daily energy consumption** (active energy imported) using historical energy data and weather information.

## Overview

The goal of this project is to predict the next 7 days of energy consumption for a building using:

- Historical daily energy usage
- Weather data (temperature, humidity)
- Temporal features (day of week, month)
- Rolling averages and lagged values of energy usage

The model is implemented using **TensorFlow / Keras** with an **LSTM architecture** for time series forecasting.

---

## Data

### Energy Data
- CSV format with columns:
  - `measurement_date` (datetime)
  - `Ea_Imp_Interval` (energy imported in Wh)
  - Other electrical metrics (optional)

### Weather Data
- CSV format with columns:
  - `time` (datetime)
  - `temperature` (°C)
  - `humidity` (%)
- Weather data is resampled to 5-minute intervals and interpolated to align with energy timestamps.

---

## Feature Engineering

- **Temporal features**:
  - `day_of_week` → one-hot encoded using `sin`/`cos` transformations (`dow_sin`, `dow_cos`)
  - `month` → cyclic encoding (`month_sin`, `month_cos`)
  
- **Lag features**:
  - Previous 1, 2, 3, 7, 14 days of energy consumption

- **Rolling averages**:
  - 7-day and 14-day rolling mean of daily energy

- **Target variable**:
  - Daily total energy consumption (`daily_energy`)

- **Scaling**:
  - `RobustScaler` is applied separately to features (`X`) and target (`y`)

---

## Model Architecture

- **Type**: LSTM (Long Short-Term Memory)
- **Input sequence length**: 14 days
- **Forecast horizon**: 7 days
- **Layers**:
  - LSTM layers with `Dropout` and `BatchNormalization`
  - Dense output layer for multi-step prediction
- **Loss function**: Mean Squared Error (MSE)
- **Optimizer**: Adam
- **Callbacks**:
  - EarlyStopping
  - ReduceLROnPlateau
- Hyperparameters tuned using `keras_tuner`

---

## Training

1. Prepare sequences:
X_seq, y_seq = create_sequence(X_scaled, y_scaled, seq_length=14, forecast_horizon=7)

2. Split data:

3. Train model:
history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=100,
    batch_size=32,
    callbacks=[EarlyStopping(patience=10), ReduceLROnPlateau()]
)