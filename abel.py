import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import tensorflow as tf
from tensorflow.keras import layers, models

df_train = pd.read_csv('game_play_data(8).csv')
df_train_player2 = df_train[df_train['Player ID'] == 2].copy()
df_train_player2.fillna('None', inplace=True)
df_train_player2['Dice Roll'] = df_train_player2['Dice Roll'].astype(str)

X_train = df_train_player2[['Turn Number', 'Coins', 'Total Cards', 'Total Landmarks', 'Dice Roll']]
y_train = df_train_player2['Action']

le_dice_roll = LabelEncoder()
X_train['Dice Roll'] = le_dice_roll.fit_transform(X_train['Dice Roll'])

le_action = LabelEncoder()
y_train = le_action.fit_transform(y_train)

X_train, X_val, y_train, y_val = train_test_split(X_train, y_train, test_size=0.2, random_state=42)

X_train = np.array(X_train)
X_val = np.array(X_val)
y_train = np.array(y_train)
y_val = np.array(y_val)

model = models.Sequential()
model.add(layers.InputLayer(input_shape=(X_train.shape[1],)))
model.add(layers.Dense(64, activation='relu'))
model.add(layers.Dense(64, activation='relu'))
model.add(layers.Dense(len(np.unique(y_train)), activation='softmax'))

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
history = model.fit(X_train, y_train, epochs=20, validation_data=(X_val, y_val), batch_size=32)

val_loss, val_accuracy = model.evaluate(X_val, y_val)
print(f"Validation Loss: {val_loss}, Validation Accuracy: {val_accuracy}")


df_test = pd.read_csv('game_play_data(34).csv')

df_test_player2 = df_test[df_test['Player ID'] == 2].copy()

df_test_player2.fillna('None', inplace=True)
df_test_player2['Dice Roll'] = df_test_player2['Dice Roll'].astype(str)
X_test = df_test_player2[['Turn Number', 'Coins', 'Total Cards', 'Total Landmarks', 'Dice Roll']]

X_test['Dice Roll'] = le_dice_roll.transform(X_test['Dice Roll'])
X_test = np.array(X_test)

y_pred = model.predict(X_test)
y_pred = np.argmax(y_pred, axis=1)

# Decode 
predicted_actions = le_action.inverse_transform(y_pred)
df_test_player2['Predicted Action'] = predicted_actions
df_test_player2.to_csv('predicted_actions_test_epoch.csv', index=False)

print(f"Predicted actions have been saved to 'predicted_actions_test_epoch.csv'.")
