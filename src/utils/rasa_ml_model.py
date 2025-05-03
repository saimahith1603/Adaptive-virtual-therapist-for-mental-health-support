
# RASA NLU Machine Learning Model
# This is a demonstration file showing the ML capabilities that would power our chatbot
# Note: This is for illustrative purposes as the actual implementation uses Gemini AI

import logging
import os
import typing
from typing import Any, Dict, List, Optional, Text, Tuple

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers
from rasa.nlu.components import Component
from rasa.nlu.config import RasaNLUModelConfig
from rasa.shared.nlu.constants import TEXT, INTENT, ENTITIES
from rasa.shared.nlu.training_data.message import Message
from rasa.shared.nlu.training_data.training_data import TrainingData
from rasa.nlu.featurizers.featurizer import Featurizer
from rasa.nlu.classifiers.classifier import IntentClassifier
from rasa.model import Fingerprint, Metadata
from rasa.utils.tensorflow.constants import EPOCHS

logger = logging.getLogger(__name__)

if typing.TYPE_CHECKING:
    from rasa.nlu.model import Metadata


class TherapyBotClassifier(IntentClassifier):
    """A custom RASA intent classifier optimized for therapy dialogue.
    
    This classifier is specifically designed to recognize emotional contexts
    and therapy-related intents with a higher degree of accuracy than
    standard classifiers.
    """

    defaults = {
        "hidden_layers_sizes": [256, 128],
        "batch_size": 32,
        "epochs": 200,
        "embedding_dimension": 100,
        "dropout_rate": 0.25,
        "learning_rate": 0.001,
        "regularization_constant": 0.002,
        "negative_sampling_factor": 20,
        "emotion_focus_weight": 1.5,
        "therapy_intent_boost": 1.2,
        "max_seq_length": 50,
    }

    def __init__(
        self,
        component_config: Optional[Dict[Text, Any]] = None,
        model: Optional[models.Model] = None,
        intent_dict: Optional[Dict[Text, int]] = None,
    ) -> None:
        """Initialize the classifier with configuration."""
        super(TherapyBotClassifier, self).__init__(component_config)
        
        self.model = model
        self.intent_dict = intent_dict or {}
        self.inverse_intent_dict = {}
        self.session = None
        self.graph = None
        
        if self.intent_dict:
            self.inverse_intent_dict = {v: k for k, v in self.intent_dict.items()}

    def _build_model(self) -> models.Model:
        """Build the neural network model architecture."""
        config = self.component_config
        
        # Input layer for text sequence
        inputs = layers.Input(shape=(config["max_seq_length"], config["embedding_dimension"]))
        
        # Additional input for emotion context
        emotion_input = layers.Input(shape=(5,))  # 5 emotion categories
        
        # Process text features
        x = layers.Bidirectional(layers.LSTM(128, return_sequences=True))(inputs)
        x = layers.GlobalMaxPooling1D()(x)
        
        # Combine with emotion data
        combined = layers.Concatenate()([x, emotion_input])
        
        # Hidden layers with regularization and dropout
        for i, size in enumerate(config["hidden_layers_sizes"]):
            combined = layers.Dense(
                size,
                activation="relu",
                kernel_regularizer=tf.keras.regularizers.l2(config["regularization_constant"]),
                name=f"hidden_layer_{i}",
            )(combined)
            combined = layers.BatchNormalization()(combined)
            combined = layers.Dropout(config["dropout_rate"])(combined)
        
        # Therapy-specific attention mechanism
        therapy_attention = layers.Dense(
            64, activation="tanh", name="therapy_attention"
        )(combined)
        attention_weights = layers.Dense(
            1, activation="sigmoid", name="attention_weights"
        )(therapy_attention)
        weighted_features = layers.Multiply()([combined, attention_weights])
        
        # Output layer
        output = layers.Dense(
            len(self.intent_dict), activation="softmax", name="intent"
        )(weighted_features)
        
        # Build and compile the model
        model = models.Model(inputs=[inputs, emotion_input], outputs=[output])
        model.compile(
            loss="categorical_crossentropy",
            optimizer=optimizers.Adam(learning_rate=config["learning_rate"]),
            metrics=["accuracy"],
        )
        
        logger.debug(f"Built intent classifier model: {model.summary()}")
        return model

    def _load_emotion_features(self, messages: List[Message]) -> np.ndarray:
        """Extract emotion features from messages."""
        emotion_features = []
        
        for message in messages:
            # Default emotion vector (neutral)
            emotion_vec = np.array([0.2, 0.2, 0.2, 0.2, 0.2])
            
            # Extract emotion if available
            if "emotion" in message.data:
                emotion = message.data["emotion"]
                
                # Convert emotion to vector
                if emotion == "happy":
                    emotion_vec = np.array([0.8, 0.1, 0.0, 0.1, 0.0])
                elif emotion == "sad":
                    emotion_vec = np.array([0.0, 0.8, 0.1, 0.0, 0.1])
                elif emotion == "angry":
                    emotion_vec = np.array([0.0, 0.1, 0.8, 0.0, 0.1])
                elif emotion == "fearful":
                    emotion_vec = np.array([0.0, 0.1, 0.0, 0.8, 0.1])
                elif emotion == "neutral":
                    emotion_vec = np.array([0.2, 0.2, 0.2, 0.2, 0.2])
            
            emotion_features.append(emotion_vec)
            
        return np.array(emotion_features)

    def train(
        self,
        training_data: TrainingData,
        config: Optional[RasaNLUModelConfig] = None,
        **kwargs: Any,
    ) -> None:
        """Train the classifier on given training data."""
        intent_names = training_data.intents
        self.intent_dict = {intent: idx for idx, intent in enumerate(intent_names)}
        self.inverse_intent_dict = {idx: intent for intent, idx in self.intent_dict.items()}
        
        if len(intent_names) < 2:
            logger.warning(
                "TherapyBotClassifier needs at least 2 intents to train. Skipping training."
            )
            return
        
        # Get text features from featurizer
        X = []
        Y = []
        
        # Group training examples by intent
        examples_by_intent = {}
        for intent in intent_names:
            examples_by_intent[intent] = [
                ex for ex in training_data.intent_examples if ex.get(INTENT) == intent
            ]
        
        # Process training examples
        for message in training_data.intent_examples:
            if self.component_config["emotion_focus_weight"] > 1.0:
                # Apply emotion focus weight for samples with emotion data
                if "emotion" in message.data:
                    # Repeat emotionally charged examples to increase their impact
                    repeats = int(self.component_config["emotion_focus_weight"])
                    for _ in range(repeats):
                        self._extract_and_add_example(message, X, Y)
                else:
                    self._extract_and_add_example(message, X, Y)
            else:
                self._extract_and_add_example(message, X, Y)
        
        X = np.array(X)
        Y = np.array(Y)
        
        # Reshape features to expected dimensions
        text_features = X.reshape(
            (X.shape[0], self.component_config["max_seq_length"], -1)
        )
        
        # Extract emotion features
        emotion_features = self._load_emotion_features(training_data.intent_examples)
        
        # Build the model
        self.model = self._build_model()
        
        # Training with callbacks for early stopping
        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=20, restore_best_weights=True
        )
        
        reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=10, min_lr=0.0001
        )
        
        tensorboard_callback = tf.keras.callbacks.TensorBoard(
            log_dir=f"./logs/therapy_classifier_{os.getpid()}",
            histogram_freq=1,
            profile_batch=0,
        )
        
        # Train the model
        history = self.model.fit(
            [text_features, emotion_features],
            Y,
            epochs=self.component_config["epochs"],
            batch_size=self.component_config["batch_size"],
            validation_split=0.15,
            callbacks=[early_stopping, reduce_lr, tensorboard_callback],
            verbose=1,
        )
        
        logger.info(f"Trained intent classifier with final accuracy: {history.history['accuracy'][-1]:.4f}")

    def _extract_and_add_example(
        self, message: Message, X: List[np.ndarray], Y: List[np.ndarray]
    ) -> None:
        """Extract features and intent labels from a message."""
        intent = message.get(INTENT)
        if intent in self.intent_dict and message.get(TEXT) is not None:
            if message.get("text_features") is not None:
                # Zero-pad or truncate feature vector to max_seq_length
                text_features = message.get("text_features")
                padded_features = np.zeros(
                    (self.component_config["max_seq_length"], text_features.shape[-1])
                )
                seq_len = min(text_features.shape[0], self.component_config["max_seq_length"])
                padded_features[:seq_len, :] = text_features[:seq_len, :]
                
                X.append(padded_features)
                
                # One-hot encode intent
                y = np.zeros(len(self.intent_dict))
                y[self.intent_dict[intent]] = 1
                Y.append(y)

    def process(self, message: Message, **kwargs: Any) -> None:
        """Process an incoming message."""
        if self.model is None:
            logger.error("Model not trained, can't predict intent.")
            return
        
        # Get features from message
        if "text_features" not in message.data:
            logger.error("No text features found in message during prediction.")
            return
        
        # Prepare text features
        text_features = message.get("text_features")
        padded_features = np.zeros(
            (1, self.component_config["max_seq_length"], text_features.shape[-1])
        )
        seq_len = min(text_features.shape[0], self.component_config["max_seq_length"])
        padded_features[0, :seq_len, :] = text_features[:seq_len, :]
        
        # Prepare emotion features
        emotion_vec = np.array([[0.2, 0.2, 0.2, 0.2, 0.2]])  # Default neutral
        if "emotion" in message.data:
            emotion = message.data["emotion"]
            # Convert emotion to vector (same as in _load_emotion_features)
            if emotion == "happy":
                emotion_vec = np.array([[0.8, 0.1, 0.0, 0.1, 0.0]])
            elif emotion == "sad":
                emotion_vec = np.array([[0.0, 0.8, 0.1, 0.0, 0.1]])
            elif emotion == "angry":
                emotion_vec = np.array([[0.0, 0.1, 0.8, 0.0, 0.1]])
            elif emotion == "fearful":
                emotion_vec = np.array([[0.0, 0.1, 0.0, 0.8, 0.1]])
        
        # Make prediction
        intent_probabilities = self.model.predict([padded_features, emotion_vec])[0]
        
        # Get intent with highest probability
        intent_id = np.argmax(intent_probabilities)
        intent_name = self.inverse_intent_dict.get(intent_id)
        
        # Set intent and confidence
        confidence = float(intent_probabilities[intent_id])
        
        # Apply therapy intent boost for specific intents
        therapy_intents = ["need_help", "feeling_sad", "anxiety", "depression", "stress"]
        if intent_name in therapy_intents:
            confidence *= self.component_config["therapy_intent_boost"]
            confidence = min(confidence, 1.0)
        
        intent = {"name": intent_name, "confidence": confidence}
        
        # Set other intents
        ranking = []
        for intent_id, score in enumerate(intent_probabilities):
            name = self.inverse_intent_dict.get(intent_id)
            score = float(score)
            
            # Apply therapy boost to specific intents in ranking
            if name in therapy_intents:
                score *= self.component_config["therapy_intent_boost"]
                score = min(score, 1.0)
                
            ranking.append({"name": name, "confidence": score})
        
        # Sort by confidence
        ranking = sorted(ranking, key=lambda k: k["confidence"], reverse=True)
        
        message.set("intent", intent, add_to_output=True)
        message.set("intent_ranking", ranking, add_to_output=True)

    def persist(self, file_name: Text, model_dir: Text) -> Dict[Text, Any]:
        """Persist the intent classifier to disk."""
        if self.model is None:
            return {"file": None}
        
        model_file_name = file_name + ".h5"
        model_file = os.path.join(model_dir, model_file_name)
        
        self.model.save(model_file)
        
        return {
            "file": model_file_name,
            "intent_dict": self.intent_dict,
        }

    @classmethod
    def load(
        cls,
        meta: Dict[Text, Any],
        model_dir: Text,
        model_metadata: Optional[Metadata] = None,
        cached_component: Optional["TherapyBotClassifier"] = None,
        **kwargs: Any,
    ) -> "TherapyBotClassifier":
        """Load the intent classifier from disk."""
        if meta.get("file") is None:
            return cls(component_config=meta)
            
        model_file = os.path.join(model_dir, meta["file"])
        
        if not os.path.exists(model_file):
            logger.warning(f"Model file {model_file} not found. Creating a new model.")
            return cls(component_config=meta)
            
        model = models.load_model(model_file)
        intent_dict = meta.get("intent_dict", {})
        
        return cls(
            component_config=meta,
            model=model,
            intent_dict=intent_dict
        )


class TherapyEmotionExtractor(Component):
    """Custom component for extracting emotions from text.
    
    This component uses a dedicated emotion detection model to identify
    emotional states in the user's messages, which can be used to enhance
    the bot's empathetic responses.
    """
    
    defaults = {
        "model_size": "base",  # Options: "tiny", "base", "large"
        "emotion_threshold": 0.6,
        "embedding_dimension": 768,
        "use_attention": True,
        "use_context": True,
        "context_window": 3,  # Number of previous messages to consider for context
    }
    
    def __init__(
        self,
        component_config: Optional[Dict[Text, Any]] = None,
        emotion_model: Optional[Any] = None,
    ) -> None:
        """Initialize the emotion extractor."""
        super(TherapyEmotionExtractor, self).__init__(component_config)
        
        self.emotion_model = emotion_model
        self.session_emotions = {}  # Track emotions across a conversation
        
    def _build_emotion_model(self) -> Any:
        """Build the emotion detection model."""
        config = self.component_config
        
        # Input for text embedding
        text_input = layers.Input(shape=(config["embedding_dimension"],))
        
        # Context input (optional)
        if config["use_context"]:
            context_input = layers.Input(shape=(config["context_window"], config["embedding_dimension"]))
            context_lstm = layers.LSTM(128)(context_input)
            combined = layers.Concatenate()([text_input, context_lstm])
        else:
            combined = text_input
        
        # Dense layers
        x = layers.Dense(256, activation="relu")(combined)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(128, activation="relu")(x)
        x = layers.Dropout(0.2)(x)
        
        # Attention mechanism (optional)
        if config["use_attention"]:
            attention = layers.Dense(128, activation="tanh")(x)
            attention_weights = layers.Dense(1, activation="sigmoid")(attention)
            x = layers.Multiply()([x, attention_weights])
        
        # Output layer with 5 basic emotions
        emotions_output = layers.Dense(5, activation="softmax", name="emotions")(x)
        
        # Create the model
        if config["use_context"]:
            model = models.Model(inputs=[text_input, context_input], outputs=[emotions_output])
        else:
            model = models.Model(inputs=[text_input], outputs=[emotions_output])
        
        # Compile the model
        model.compile(
            optimizer=optimizers.Adam(learning_rate=0.001),
            loss="categorical_crossentropy",
            metrics=["accuracy"]
        )
        
        return model
        
    def train(
        self,
        training_data: TrainingData,
        config: Optional[RasaNLUModelConfig] = None,
        **kwargs: Any,
    ) -> None:
        """Train the emotion detection model."""
        if not training_data.nlu_examples:
            logger.warning("No training examples found, skipping emotion extractor training")
            return
            
        # Build the model if it doesn't exist
        if self.emotion_model is None:
            self.emotion_model = self._build_emotion_model()
            
        # Extract examples with emotion labels
        examples_with_emotions = []
        for example in training_data.training_examples:
            if example.get("emotion") is not None:
                examples_with_emotions.append(example)
                
        if len(examples_with_emotions) < 10:
            logger.warning(
                f"Only {len(examples_with_emotions)} training examples have emotion labels. "
                "Consider adding more labeled data for better emotion detection."
            )
            
        # Prepare training data
        X = []
        Y = []
        
        # Emotion mapping
        emotion_map = {
            "happy": 0,
            "sad": 1,
            "angry": 2,
            "fearful": 3,
            "neutral": 4
        }
        
        for example in examples_with_emotions:
            # Get text embeddings
            if example.get("text_features") is not None:
                # Use the mean of word embeddings as sentence embedding
                text_features = example.get("text_features")
                sentence_embedding = np.mean(text_features, axis=0)
                X.append(sentence_embedding)
                
                # Get emotion label
                emotion = example.get("emotion", "neutral")
                emotion_idx = emotion_map.get(emotion, 4)  # Default to neutral
                
                # One-hot encode
                y = np.zeros(5)
                y[emotion_idx] = 1
                Y.append(y)
                
        if X and Y:
            X = np.array(X)
            Y = np.array(Y)
            
            # Context handling (dummy context for training)
            if self.component_config["use_context"]:
                # Create dummy context embeddings
                context_X = np.zeros((len(X), self.component_config["context_window"], self.component_config["embedding_dimension"]))
                
                # Train with context
                self.emotion_model.fit(
                    [X, context_X],
                    Y,
                    epochs=50,
                    batch_size=16,
                    validation_split=0.2,
                    callbacks=[
                        tf.keras.callbacks.EarlyStopping(
                            monitor="val_loss",
                            patience=5,
                            restore_best_weights=True
                        )
                    ]
                )
            else:
                # Train without context
                self.emotion_model.fit(
                    X,
                    Y,
                    epochs=50,
                    batch_size=16,
                    validation_split=0.2,
                    callbacks=[
                        tf.keras.callbacks.EarlyStopping(
                            monitor="val_loss",
                            patience=5,
                            restore_best_weights=True
                        )
                    ]
                )
            
            logger.info("Emotion extractor training completed.")
        else:
            logger.warning("No valid training examples for emotion extraction. Skipping training.")
    
    def process(self, message: Message, **kwargs: Any) -> None:
        """Extract emotions from the incoming message."""
        if self.emotion_model is None:
            logger.warning("Emotion model not trained, skipping emotion extraction")
            return
            
        if message.get("text_features") is None:
            logger.debug("No text features available, skipping emotion extraction")
            return
            
        # Get text features
        text_features = message.get("text_features")
        sentence_embedding = np.mean(text_features, axis=0).reshape(1, -1)
        
        # Get conversation ID
        conversation_id = message.get("conversation_id", "default")
        
        # Get emotion context
        if self.component_config["use_context"] and conversation_id in self.session_emotions:
            context = self.session_emotions[conversation_id]
            
            # Pad context if needed
            if len(context) < self.component_config["context_window"]:
                padding = [np.zeros((self.component_config["embedding_dimension"],)) for _ in 
                          range(self.component_config["context_window"] - len(context))]
                context = padding + context
            
            # Keep only the most recent context
            context = context[-self.component_config["context_window"]:]
            
            # Convert to numpy array
            context_embeddings = np.array(context).reshape(
                1, self.component_config["context_window"], self.component_config["embedding_dimension"]
            )
            
            # Predict with context
            emotion_probs = self.emotion_model.predict([sentence_embedding, context_embeddings])[0]
        else:
            # Predict without context
            if self.component_config["use_context"]:
                # Create dummy context
                dummy_context = np.zeros(
                    (1, self.component_config["context_window"], self.component_config["embedding_dimension"])
                )
                emotion_probs = self.emotion_model.predict([sentence_embedding, dummy_context])[0]
            else:
                emotion_probs = self.emotion_model.predict(sentence_embedding)[0]
        
        # Map probabilities to emotions
        emotions = ["happy", "sad", "angry", "fearful", "neutral"]
        emotion_confidences = {emotions[i]: float(emotion_probs[i]) for i in range(len(emotions))}
        
        # Get the most likely emotion
        max_emotion = max(emotion_confidences.items(), key=lambda x: x[1])
        
        # Only set emotion if confidence exceeds threshold
        if max_emotion[1] > self.component_config["emotion_threshold"]:
            detected_emotion = max_emotion[0]
        else:
            detected_emotion = "neutral"
            
        # Update message
        message.set("emotion", detected_emotion, add_to_output=True)
        message.set("emotion_ranking", [
            {"name": emotion, "confidence": confidence}
            for emotion, confidence in sorted(
                emotion_confidences.items(), key=lambda x: x[1], reverse=True
            )
        ])
        
        # Update context for future messages
        if self.component_config["use_context"]:
            if conversation_id not in self.session_emotions:
                self.session_emotions[conversation_id] = []
                
            # Add current embedding to context
            self.session_emotions[conversation_id].append(sentence_embedding[0])
            
            # Keep only the most recent N embeddings
            self.session_emotions[conversation_id] = self.session_emotions[conversation_id][
                -self.component_config["context_window"]:
            ]
    
    def persist(self, file_name: Text, model_dir: Text) -> Dict[Text, Any]:
        """Persist the component to disk."""
        if self.emotion_model is None:
            return {"file": None}
            
        model_file_name = file_name + "_emotion.h5"
        model_file = os.path.join(model_dir, model_file_name)
        
        self.emotion_model.save(model_file)
        
        return {"file": model_file_name}
        
    @classmethod
    def load(
        cls,
        meta: Dict[Text, Any],
        model_dir: Text,
        model_metadata: Optional[Metadata] = None,
        cached_component: Optional["TherapyEmotionExtractor"] = None,
        **kwargs: Any,
    ) -> "TherapyEmotionExtractor":
        """Load the component from disk."""
        if meta.get("file") is None:
            return cls(component_config=meta)
            
        model_file = os.path.join(model_dir, meta["file"])
        
        if not os.path.exists(model_file):
            logger.warning(f"Emotion model file {model_file} not found. Creating a new model.")
            return cls(component_config=meta)
            
        emotion_model = models.load_model(model_file)
        
        return cls(component_config=meta, emotion_model=emotion_model)


# Sample code demonstrating usage
def load_therapy_bot_model(model_dir: str) -> Dict[str, Any]:
    """Load the therapy bot model components."""
    components = {}
    
    # Load emotion extractor
    emotion_meta = {"file": "emotion_extractor.h5"}
    components["emotion_extractor"] = TherapyEmotionExtractor.load(emotion_meta, model_dir)
    
    # Load intent classifier
    classifier_meta = {"file": "therapy_classifier.h5"}
    components["intent_classifier"] = TherapyBotClassifier.load(classifier_meta, model_dir)
    
    return components


def predict_therapy_response(user_message: str, emotion: str = None) -> Dict[str, Any]:
    """Predict therapy response using loaded models."""
    # This would be connected to the actual response generation
    # In our case, we're using Gemini AI instead of this model
    
    # For demonstration purposes
    return {
        "intent": "comfort_user",
        "confidence": 0.87,
        "emotion": emotion or "neutral",
        "response": "I understand how you're feeling. Let's talk more about that.",
    }


# Example of training pipeline configuration for Rasa
PIPELINE_CONFIG = """
language: "en"
pipeline:
  - name: "WhitespaceTokenizer"
  - name: "RegexFeaturizer"
  - name: "LexicalSyntacticFeaturizer"
  - name: "CountVectorsFeaturizer"
  - name: "CountVectorsFeaturizer"
    analyzer: "char_wb"
    min_ngram: 1
    max_ngram: 4
  - name: "DIETClassifier"
    epochs: 100
    constrain_similarities: true
  - name: "TherapyEmotionExtractor"
    model_size: "base"
    emotion_threshold: 0.6
    use_attention: true
    use_context: true
  - name: "TherapyBotClassifier"
    hidden_layers_sizes: [256, 128]
    epochs: 200
    batch_size: 32
    emotion_focus_weight: 1.5
    therapy_intent_boost: 1.2
  - name: "EntitySynonymMapper"
  - name: "ResponseSelector"
    epochs: 100
    constrain_similarities: true
  - name: "FallbackClassifier"
    threshold: 0.7
    ambiguity_threshold: 0.1
"""
