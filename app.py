import streamlit as st
import google.generativeai as genai
from PIL import Image

# Configure Streamlit page
st.set_page_config(page_title="Receipt Analyzer", page_icon="🧾")

# Sidebar for API key configuration (safer than .env in Streamlit)
with st.sidebar:
    st.title("API_KEY Configuration")
    GOOGLE_API_KEY = st.text_input("Enter Google API Key:", type="password")
    if GOOGLE_API_KEY:
        genai.configure(api_key=GOOGLE_API_KEY)
    else:
        st.warning("Please enter your Google API key to proceed!")

# Model Configuration
MODEL_CONFIG = {
    "temperature": 0.2,
    "top_p": 1,
    "top_k": 32,
    "max_output_tokens": 4096,
}

safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"}
]

# Load Gemini model
@st.cache_resource
def load_model():
    return genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=MODEL_CONFIG,
        safety_settings=safety_settings
    )

model = load_model()

# System prompt
SYSTEM_PROMPT = """
You are a specialist in comprehending receipts. 
Input images in the form of receipts will be provided to you,
and your task is to respond to questions based on the content of the input image.
"""

# Main app interface
st.title("🧾 Receipt Analyzer AI")
st.write("Upload a receipt image and ask questions about its contents")

# File uploader
uploaded_file = st.file_uploader("Choose a receipt image...", type=["jpg", "jpeg", "png"])

# Question input
user_question = st.text_input("Ask a question about the receipt:", placeholder="What is the total amount?")

# Process input and generate response
if uploaded_file and user_question and GOOGLE_API_KEY:
    if st.button("Analyze Receipt"):
        with st.spinner("Analyzing receipt..."):
            try:
                # Read image
                image = Image.open(uploaded_file)
                
                # Prepare inputs
                input_prompt = [SYSTEM_PROMPT, image, user_question]
                
                # Generate response
                response = model.generate_content(input_prompt)
                
                # Display response
                st.subheader("Analysis Result:")
                st.success(response.text)
                
            except Exception as e:
                st.error(f"Error processing request: {str(e)}")
elif uploaded_file and user_question and not GOOGLE_API_KEY:
    st.warning("Please enter your Google API key in the sidebar to continue!")

# Add some instructions
st.markdown("""
**How to use:**
1. Enter your Google API key in the sidebar
2. Upload a receipt image (JPG/PNG)
3. Type your question about the receipt
4. Click "Analyze Receipt"
            
**Example questions:**
- What is the total amount?
- What is the purchase date?
- List all items purchased
- What is the merchant's address?
""")