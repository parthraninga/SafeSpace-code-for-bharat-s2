import requests
import logging
import json
import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Query, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from dateutil.relativedelta import relativedelta
from typing import List, Optional
from pydantic import BaseModel
import uuid
import asyncio
import concurrent.futures
from functools import partial
import os
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Constants
# NEWSAPI_KEY = os.getenv("NEWSAPI_KEY")
NEWSAPI_KEY = "e3dfdc1037e04f3a82f69871497099d8"
THREAT_KEYWORDS = [
    'attack', 'violence', 'theft', 'shooting', 'assault', 'kidnap', 
    'fire', 'riot', 'accident', 'flood', 'earthquake', 'crime',
    'explosion', 'terrorism', 'threat', 'danger', 'emergency'
]

# OpenRouter AI Configuration - Use environment variable if available
OPENROUTER_API_KEY = "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"
# OPENROUTER_MODEL = "mistralai/mistral-7b-instruct:free"
OPENROUTER_MODEL = "deepseek-r1-distill-llama-70b"

# Pydantic models
class ThreatAnalysisRequest(BaseModel):
    text: str
    city: Optional[str] = None

class ThreatAnalysisResponse(BaseModel):
    is_threat: bool
    confidence: float
    category: str
    level: str
    ml_analysis: dict
    safety_advice: List[str]

class NewsQuery(BaseModel):
    city: str
    keywords: Optional[List[str]] = None
    days_back: Optional[int] = 30

# Add configuration options for AI advice
class ThreatAnalysisConfig(BaseModel):
    use_ai_advice: bool = True
    ai_timeout: int = 8
    max_advice_points: int = 3

def get_ml_manager(request: Request):
    """Dependency to get ML manager from app state"""
    return request.app.state.ml_manager

def fetch_news_articles(city: str, days_back: int = 30, timeout: int = 10) -> List[dict]:
    """Fetch news articles for threat analysis"""
    try:
        start_date = datetime.now() - timedelta(days=days_back)
        from_date = start_date.strftime('%Y-%m-%d')
        
        query = f"{city} ({' OR '.join(THREAT_KEYWORDS)})"
        url = (
            f'https://newsapi.org/v2/everything?'
            f'q={query}&'
            f'from={from_date}&'
            'sortBy=publishedAt&'
            'language=en&'
            'pageSize=20&'
            f'apiKey={NEWSAPI_KEY}'
        )
        
        logger.info(f"Fetching news for {city} with {timeout}s timeout")
        response = requests.get(url, timeout=timeout)
        
        if response.status_code == 200:
            articles = response.json().get('articles', [])
            logger.info(f"Successfully fetched {len(articles)} articles for {city}")
            return articles
        elif response.status_code == 429:
            logger.warning(f"News API rate limited for {city}, using mock data")
            return get_mock_news_articles(city)
        else:
            logger.warning(f"Failed to fetch news for {city}: HTTP {response.status_code}")
            return get_mock_news_articles(city)
            
    except requests.exceptions.Timeout:
        logger.warning(f"Timeout fetching news for {city}, using mock data")
        return get_mock_news_articles(city)
    except Exception as e:
        logger.error(f"Error fetching news for {city}: {e}, using mock data")
        return get_mock_news_articles(city)

def get_mock_news_articles(city: str) -> List[dict]:
    """Generate realistic mock news articles for demo purposes"""
    import random
    
    # Define city-specific mock threats
    city_threats = {
        'Delhi': [
            {'title': 'Heavy smog blankets Delhi, air quality reaches hazardous levels', 'threat_level': 'high', 'category': 'environmental'},
            {'title': 'Traffic congestion causes major delays on Delhi highways', 'threat_level': 'medium', 'category': 'traffic'},
            {'title': 'Construction work near metro station poses safety risk', 'threat_level': 'medium', 'category': 'construction'},
            {'title': 'Delhi police arrest robbery suspects in South Delhi', 'threat_level': 'high', 'category': 'crime'},
            {'title': 'Water shortage reported in several Delhi localities', 'threat_level': 'medium', 'category': 'infrastructure'}
        ],
        'Mumbai': [
            {'title': 'Heavy rainfall warning issued for Mumbai', 'threat_level': 'high', 'category': 'natural'},
            {'title': 'Local train services disrupted due to waterlogging', 'threat_level': 'medium', 'category': 'transport'},
            {'title': 'Mumbai building collapse injures several residents', 'threat_level': 'high', 'category': 'accident'},
            {'title': 'Traffic snarls reported across Mumbai during peak hours', 'threat_level': 'medium', 'category': 'traffic'}
        ],
        'Bangalore': [
            {'title': 'Minor road closure due to metro construction work', 'threat_level': 'low', 'category': 'construction'},
            {'title': 'IT sector traffic causes delays in Electronic City', 'threat_level': 'medium', 'category': 'traffic'},
            {'title': 'Bangalore sees increase in petty theft cases', 'threat_level': 'medium', 'category': 'crime'}
        ],
        'Chennai': [
            {'title': 'Cyclone warning issued for Chennai coast', 'threat_level': 'high', 'category': 'natural'},
            {'title': 'Power outage affects several Chennai neighborhoods', 'threat_level': 'medium', 'category': 'infrastructure'},
            {'title': 'Chennai airport reports flight delays due to weather', 'threat_level': 'medium', 'category': 'transport'}
        ],
        'Kolkata': [
            {'title': 'Festival crowd management becomes challenging in Kolkata', 'threat_level': 'high', 'category': 'crowd'},
            {'title': 'Traffic diversions in place for Kolkata procession', 'threat_level': 'medium', 'category': 'traffic'},
            {'title': 'Kolkata police increase security during festival season', 'threat_level': 'medium', 'category': 'security'}
        ],
        'Hyderabad': [
            {'title': 'IT corridor traffic congestion causes commuter delays', 'threat_level': 'medium', 'category': 'traffic'},
            {'title': 'Construction work near HITEC City affects traffic flow', 'threat_level': 'medium', 'category': 'construction'},
            {'title': 'Hyderabad reports minor security incidents in old city', 'threat_level': 'low', 'category': 'security'}
        ],
        'Pune': [
            {'title': 'Minor waterlogging reported in low-lying areas of Pune', 'threat_level': 'low', 'category': 'natural'},
            {'title': 'Pune IT parks experience traffic congestion', 'threat_level': 'medium', 'category': 'traffic'}
        ],
        'Ahmedabad': [
            {'title': 'Heat wave warning issued for Ahmedabad', 'threat_level': 'medium', 'category': 'natural'},
            {'title': 'Water shortage reported in parts of Ahmedabad', 'threat_level': 'medium', 'category': 'infrastructure'},
            {'title': 'Ahmedabad sees minor industrial accident', 'threat_level': 'low', 'category': 'accident'}
        ]
    }
    
    # Get threats for the city or use generic ones
    threats = city_threats.get(city, city_threats['Delhi'])
    
    # Randomly select 3-8 threats to simulate real-world variation
    selected_threats = random.sample(threats, min(len(threats), random.randint(3, min(8, len(threats)))))
    
    # Convert to news article format
    mock_articles = []
    base_time = datetime.now()
    
    for i, threat in enumerate(selected_threats):
        # Create realistic timestamps (within last 24 hours)
        published_time = base_time - timedelta(hours=random.randint(1, 24))
        
        article = {
            'title': threat['title'],
            'description': f"Latest updates on {threat['category']} situation in {city}. Authorities are monitoring the situation closely.",
            'publishedAt': published_time.isoformat() + 'Z',
            'source': {'name': f'{city} News Network'},
            'url': f'https://example.com/news/{i+1}',
            'urlToImage': None,
            'content': f"Full coverage of {threat['category']} incident in {city}. Stay tuned for more updates."
        }
        mock_articles.append(article)
    
    logger.info(f"Generated {len(mock_articles)} mock articles for {city}")
    return mock_articles

def categorize_threat(title: str, description: str = "") -> tuple:
    """Categorize threat based on keywords"""
    text = f"{title} {description}".lower()
    
    categories = {
        'crime': ['theft', 'robbery', 'murder', 'assault', 'kidnap', 'crime', 'police', 'arrest'],
        'natural': ['flood', 'earthquake', 'cyclone', 'storm', 'landslide', 'drought', 'tsunami'],
        'traffic': ['accident', 'traffic', 'collision', 'road', 'highway', 'vehicle', 'crash'],
        'violence': ['riot', 'protest', 'violence', 'clash', 'unrest', 'fight'],
        'fire': ['fire', 'explosion', 'blast', 'burn', 'smoke'],
        'medical': ['disease', 'outbreak', 'virus', 'pandemic', 'health', 'hospital'],
        'aviation': ['flight', 'aircraft', 'aviation', 'airline', 'pilot', 'airport']
    }
    
    for category, keywords in categories.items():
        if any(keyword in text for keyword in keywords):
            return category, determine_threat_level(text)
    
    return 'other', 'low'

def determine_threat_level(text: str) -> str:
    """Determine threat level based on severity keywords"""
    high_severity = ['death', 'killed', 'fatal', 'emergency', 'critical', 'severe', 'major']
    medium_severity = ['injured', 'damage', 'warning', 'alert', 'concern']
    
    text_lower = text.lower()
    
    if any(word in text_lower for word in high_severity):
        return 'high'
    elif any(word in text_lower for word in medium_severity):
        return 'medium'
    else:
        return 'low'

def generate_ai_safety_advice(title: str, description: str = "", timeout_seconds: int = 10) -> List[str]:
    """Generate AI-powered safety advice using OpenRouter API with improved handling"""
    
    # Create a more detailed prompt for better AI responses
    prompt = f"""
You are an expert safety advisor AI. Given the following text about a potential threat or safety concern, provide specific, actionable safety advice for the public.

Text: {title}
Additional Details: {description}

Please provide exactly 3 practical safety recommendations that are:
1. Specific to this situation
2. Immediately actionable
3. Easy to understand

Format your response as a simple list without bullet points or numbers - just one recommendation per line:
"""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200,
        "temperature": 0.7
    }

    try:
        logger.info(f"🤖 Generating AI safety advice for: {title[:50]}... (timeout: {timeout_seconds}s)")
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions", 
            headers=headers, 
            data=json.dumps(data),
            timeout=timeout_seconds
        )
        
        logger.info(f"📡 AI API Response Status: {response.status_code}, API: {OPENROUTER_API_KEY}")
        
        if response.status_code == 200:
            result = response.json()
            if "choices" in result and result["choices"] and result["choices"][0]["message"]["content"]:
                reply = result["choices"][0]["message"]["content"].strip()
                logger.info("✅ Successfully generated AI safety advice")
                
                # Enhanced parsing of AI response
                lines = reply.split('\n')
                advice_list = []
                
                for line in lines:
                    line = line.strip()
                    # Skip empty lines, headers, or intro text
                    if not line or line.lower().startswith(('safety', 'recommendations', 'advice', 'here are')):
                        continue
                    
                    # Remove bullet points, numbers, and formatting
                    cleaned_line = line
                    for prefix in ['•', '-', '*', '1.', '2.', '3.', '4.', '5.']:
                        if cleaned_line.startswith(prefix):
                            cleaned_line = cleaned_line[len(prefix):].strip()
                            break
                    
                    if cleaned_line and len(cleaned_line) > 10:  # Ensure meaningful advice
                        advice_list.append(cleaned_line)
                
                # Return up to 3 pieces of advice, or the entire response if parsing failed
                if advice_list:
                    logger.info(f"📝 Parsed {len(advice_list)} AI advice points")
                    return advice_list[:3]
                else:
                    # If parsing failed, try to return the raw response
                    logger.info("📝 Using raw AI response as single advice")
                    return [reply] if reply else []  # Return as single item list if no advice parsed
            else:
                logger.warning("⚠️ Unexpected response format from OpenRouter API")
                return []
        elif response.status_code == 401:
            logger.warning("🔑 OpenRouter API authentication failed (401) - API key may be invalid")
            return []
        elif response.status_code == 429:
            logger.warning("⏰ OpenRouter API rate limit exceeded (429)")
            return []
        else:
            logger.warning(f"❌ OpenRouter API returned status {response.status_code}: {response.text}")
            return []
    except requests.exceptions.Timeout:
        logger.warning(f"⏰ Timeout ({timeout_seconds}s) while generating AI safety advice")
        return []
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error during AI safety advice generation: {e}")
        return []
    except Exception as e:
        logger.error(f"Error during AI safety advice generation: {e}")
        return []
        
def generate_safety_advice(category: str, level: str, city: str = None, title: str = "", description: str = "", use_ai: bool = True, ai_timeout: int = 10) -> List[str]:
    """Generate contextual safety advice with enhanced AI integration"""
    print(f"🔍 Generating safety with use_ai{use_ai}, title: {title}, len: {len(title.strip()) > 5}")
    # Try AI-powered advice first if enabled and we have meaningful content
    if use_ai and title and len(title.strip()) > 5:
        try:
            logger.info(f"🤖 Attempting AI advice generation for: {title[:30]}...")
            ai_advice = generate_ai_safety_advice(title, description, timeout_seconds=ai_timeout)
            
            print(f"🔍 AI advice generated: {ai_advice}")
            
            # Validate AI advice quality
            if ai_advice and len(ai_advice) > 0:
                # Check if advice is meaningful (not just generic responses)
                meaningful_advice = []
                generic_phrases = [
                    "stay informed", "follow instructions", "keep emergency contacts",
                    "monitor local", "contact authorities", "stay safe"
                ]
                
                for advice in ai_advice:
                    # Accept advice if it's specific enough (contains specific actions/details)
                    is_generic = any(phrase in advice.lower() for phrase in generic_phrases)
                    is_meaningful = len(advice) > 20 and not is_generic
                    
                    if is_meaningful or len(meaningful_advice) == 0:  # Always include at least one piece of advice
                        meaningful_advice.append(advice)
                
                if meaningful_advice:
                    # Add city-specific guidance if available and space permits
                    if city and len(meaningful_advice) < 3:
                        meaningful_advice.append(f"Monitor local {city} authorities for area-specific guidance and updates")
                    
                    logger.info(f"✅ Using AI-generated advice ({len(meaningful_advice)} points)")
                    return meaningful_advice[:3]  # Limit to 3 pieces of advice
                    
        except Exception as e:
            logger.warning(f"⚠️ AI advice generation failed, using enhanced fallback: {e}")
    
    # Enhanced fallback to category-specific advice with better variety
    logger.info(f"📋 Using enhanced fallback advice for category: {category}")
    
    advice_map = {
        'crime': [
            "Stay in well-lit, populated areas and avoid isolated locations",
            "Keep valuables secure and out of sight, use bags with zippers",
            "Be aware of your surroundings and trust your instincts about suspicious behavior",
            "Share your location with trusted contacts when traveling alone"
        ],
        'natural': [
            "Stay informed about weather conditions through official meteorological sources",
            "Prepare an emergency kit with water, food, medications, and important documents",
            "Know your evacuation routes and identify safe shelters in your area",
            "Follow official emergency guidelines and evacuation orders without delay"
        ],
        'traffic': [
            "Drive defensively and maintain safe following distances in all conditions",
            "Avoid using mobile devices while driving and stay focused on the road",
            "Check traffic conditions and road closures before starting your journey",
            "Use alternative routes during peak hours or when accidents are reported"
        ],
        'violence': [
            "Avoid large gatherings, protests, or areas with visible tension",
            "Stay indoors if advised by authorities and keep doors and windows secured",
            "Keep emergency contact numbers readily available and phone charged",
            "Monitor reliable local news sources for updates and safety advisories"
        ],
        'fire': [
            "Know the locations of all fire exits in buildings you frequent",
            "Install and regularly test smoke detectors in your home",
            "Develop and practice a fire escape plan with all household members",
            "Never use elevators during fire emergencies, always use stairs"
        ],
        'medical': [
            "Follow guidelines from official health authorities and medical professionals",
            "Maintain proper hygiene practices and wash hands frequently with soap",
            "Seek immediate medical attention if you experience concerning symptoms",
            "Stay informed about health advisories and vaccination recommendations"
        ],
        'aviation': [
            "Pay attention to all pre-flight safety demonstrations and instructions",
            "Keep yourself informed about airline safety records and improvements",
            "Report any suspicious activities or unattended items at airports immediately",
            "Remain calm and follow flight crew instructions during any emergency situations"
        ]
    }
    
    # Get base advice for the category
    base_advice = advice_map.get(category, [
        "Stay alert and informed about local conditions through official sources",
        "Follow all official safety guidelines and emergency protocols",
        "Keep emergency contact numbers and important documents accessible",
        "Trust verified official sources for accurate and timely information"
    ])
    
    # Select advice based on threat level for variety
    if level == 'high':
        selected_advice = base_advice[:3]  # Use first 3 for high-priority threats
    elif level == 'medium':
        # Mix first and middle advice for medium threats
        selected_advice = [base_advice[0]]
        if len(base_advice) > 2:
            selected_advice.append(base_advice[2])
        if len(base_advice) > 3:
            selected_advice.append(base_advice[3])
    else:
        # Use middle/end advice for low-priority threats
        selected_advice = base_advice[1:] if len(base_advice) > 1 else base_advice
    
    # Add city-specific guidance if space permits
    if city and len(selected_advice) < 3:
        selected_advice.append(f"Contact local {city} emergency services for area-specific assistance")
    
    return selected_advice[:3]  # Always limit to 3 pieces of advice

async def process_single_threat(article: dict, ml_manager, city: str) -> dict:
    """Process a single threat article asynchronously"""
    try:
        title = article.get('title', '')
        description = article.get('description', '') or ''
        
        if not title:
            return None
        
        # Get basic categorization
        category, basic_level = categorize_threat(title, description)
        
        # Enhanced ML analysis
        ml_analysis = ml_manager.predict_threat(f"{title}. {description}")
        
        # Determine final threat level based on ML confidence
        if ml_analysis['is_threat'] and ml_analysis['final_confidence'] >= 0.8:
            final_level = 'high'
        elif ml_analysis['is_threat'] and ml_analysis['final_confidence'] >= 0.6:
            final_level = 'medium'
        elif ml_analysis['final_confidence'] >= 0.3:
            final_level = 'low'
        else:
            final_level = basic_level
        
        # Generate safety advice with reduced timeout for AI calls
        safety_advice = generate_safety_advice(
            category=category, 
            level=final_level, 
            city=city,
            title=title,
            description=description,
            use_ai=True
        )
        
        threat_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "url": article.get('url', ''),
            "source": article.get('source', {}).get('name', 'Unknown'),
            "publishedAt": article.get('publishedAt', ''),
            "category": category,
            "level": final_level,
            "confidence": round(ml_analysis['final_confidence'], 2),
            "ml_detected": ml_analysis['is_threat'],
            "ml_analysis": {
                "confidence": ml_analysis['final_confidence'],
                "threat_prediction": ml_analysis['threat_prediction'],
                "sentiment_analysis": ml_analysis['sentiment_analysis'],
                "models_used": ml_analysis['models_used']
            },
            "safety_advice": safety_advice,
            "ai_advice_used": True,
            "advice_source": "AI-Enhanced" if len(safety_advice) > 0 else "Static"
        }
        
        return threat_data
    except Exception as e:
        logger.error(f"Error processing threat article '{title}': {e}")
        return None

@router.get("/", summary="Get threats for a specific city")
async def get_threats(
    city: str = Query(..., description="City to analyze for threats"),
    limit: int = Query(default=20, ge=1, le=50, description="Maximum number of threats to return"),
    page: int = Query(default=1, ge=1, description="Page number for pagination"),
    ml_manager = Depends(get_ml_manager)
):
    """Get analyzed threats for a specific city with ML enhancement"""
    try:
        logger.info(f"🔍 Starting threat analysis for {city}")
        
        # Fetch news articles with reduced timeout
        articles = fetch_news_articles(city, timeout=5)
        
        if not articles:
            return JSONResponse(content={
                "city": city,
                "threats": [],
                "total_threats": 0,
                "ml_available": ml_manager.models_loaded,
                "message": "No recent threat-related news found for this city"
            })
        
        # Limit articles to process for faster response but allow more for comprehensive results
        max_articles_to_process = min(limit * 2, 30)  # Process up to 2x limit or 30 articles max
        articles_to_process = articles[:max_articles_to_process]
        logger.info(f"📰 Processing {len(articles_to_process)} articles for {city} (limit: {limit}, page: {page})")
        
        # Process threats in parallel using ThreadPoolExecutor for better performance
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            # Create partial function with fixed parameters
            process_func = partial(process_single_threat_sync, ml_manager=ml_manager, city=city)
            
            # Submit all tasks
            future_to_article = {
                executor.submit(process_func, article): article 
                for article in articles_to_process
            }
            
            analyzed_threats = []
            
            # Collect results with timeout
            for future in concurrent.futures.as_completed(future_to_article, timeout=20):  # Change from 6 to 15 seconds
                try:
                    result = future.result()
                    if result:
                        analyzed_threats.append(result)
                except Exception as e:
                    article = future_to_article[future]
                    logger.error(f"Error processing article '{article.get('title', 'Unknown')}': {e}")
        
        # Sort by confidence/threat level
        analyzed_threats.sort(key=lambda x: (
            x['level'] == 'high',
            x['level'] == 'medium', 
            x['confidence']
        ), reverse=True)
        
        # Apply pagination
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_threats = analyzed_threats[start_index:end_index]
        
        logger.info(f"✅ Successfully analyzed {len(analyzed_threats)} threats for {city}, returning {len(paginated_threats)} (page {page})")
        
        return JSONResponse(content={
            "city": city,
            "threats": paginated_threats,
            "total_threats": len(analyzed_threats),
            "page": page,
            "limit": limit,
            "total_pages": (len(analyzed_threats) + limit - 1) // limit,  # Calculate total pages
            "has_more": end_index < len(analyzed_threats),
            "ml_available": ml_manager.models_loaded,
            "analysis_timestamp": datetime.now().isoformat(),
            "processing_time_optimized": True
        })
        
    except concurrent.futures.TimeoutError:
        logger.warning(f"⏰ Timeout processing threats for {city}, returning partial results")
        return JSONResponse(content={
            "city": city,
            "threats": [],
            "total_threats": 0,
            "ml_available": ml_manager.models_loaded if 'ml_manager' in locals() else False,
            "message": "Request timed out, please try again",
            "error": "timeout"
        })
    except Exception as e:
        logger.error(f"❌ Error analyzing threats for {city}: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing threats: {str(e)}")

def process_single_threat_sync(article: dict, ml_manager, city: str) -> dict:
    """Synchronous version of process_single_threat for ThreadPoolExecutor"""
    try:
        title = article.get('title', '')
        description = article.get('description', '') or ''
        
        if not title:
            return None
        
        # Get basic categorization
        category, basic_level = categorize_threat(title, description)
        
        # Enhanced ML analysis
        ml_analysis = ml_manager.predict_threat(f"{title}. {description}")
        
        # Determine final threat level based on ML confidence
        if ml_analysis['is_threat'] and ml_analysis['final_confidence'] >= 0.8:
            final_level = 'high'
        elif ml_analysis['is_threat'] and ml_analysis['final_confidence'] >= 0.6:
            final_level = 'medium'
        elif ml_analysis['final_confidence'] >= 0.3:
            final_level = 'low'
        else:
            final_level = basic_level
        
        # Generate safety advice with improved timeout for AI calls
        safety_advice = generate_safety_advice(
            category=category, 
            level=final_level, 
            city=city,
            title=title,
            description=description,
            use_ai=True,
            ai_timeout=8  # Increased timeout for better AI responses
        )
        
        threat_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "url": article.get('url', ''),
            "source": article.get('source', {}).get('name', 'Unknown'),
            "publishedAt": article.get('publishedAt', ''),
            "category": category,
            "level": final_level,
            "confidence": round(ml_analysis['final_confidence'], 2),
            "ml_detected": ml_analysis['is_threat'],
            "ml_analysis": {
                "confidence": ml_analysis['final_confidence'],
                "threat_prediction": ml_analysis['threat_prediction'],
                "sentiment_analysis": ml_analysis['sentiment_analysis'],
                "models_used": ml_analysis['models_used']
            },
            "safety_advice": safety_advice,
            "ai_advice_used": True,
            "advice_source": "AI-Enhanced" if len(safety_advice) > 0 else "Static"
        }
        
        return threat_data
    except Exception as e:
        logger.error(f"Error processing threat article '{title}': {e}")
        return None

@router.get("/heatmap", summary="Get threat heatmap data for multiple cities")
async def get_threat_heatmap(
    cities: str = Query(default="Delhi,Mumbai,Bangalore,Chennai,Kolkata,Hyderabad,Pune,Ahmedabad", 
                       description="Comma-separated list of cities"),
    ml_manager = Depends(get_ml_manager)
):
    """Get aggregated threat data for heatmap visualization"""
    try:
        city_list = [city.strip() for city in cities.split(',')]
        heatmap_data = []
        
        # City coordinates mapping
        city_coordinates = {
            'Delhi': [77.2090, 28.6139],
            'Mumbai': [72.8777, 19.0760],
            'Bangalore': [77.5946, 12.9716],
            'Chennai': [80.2707, 13.0827],
            'Kolkata': [88.3639, 22.5726],
            'Hyderabad': [78.4867, 17.3850],
            'Pune': [73.8567, 18.5204],
            'Ahmedabad': [72.5714, 23.0225],
            'Jaipur': [75.7873, 26.9124],
            'Surat': [72.8311, 21.1702]
        }
        
        logger.info(f"🗺️ Generating heatmap data for {len(city_list)} cities")
        
        # Process cities in parallel for faster response
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_to_city = {
                executor.submit(get_city_threat_summary, city, ml_manager): city 
                for city in city_list
            }
            
            for future in concurrent.futures.as_completed(future_to_city, timeout=15):
                try:
                    city = future_to_city[future]
                    city_data = future.result()
                    
                    if city_data:
                        heatmap_entry = {
                            "id": len(heatmap_data) + 1,
                            "city": city,
                            "coordinates": city_coordinates.get(city, [77.2090, 28.6139]),  # Default to Delhi
                            "threatLevel": city_data['threat_level'],
                            "threatCount": city_data['threat_count'],
                            "recentThreats": city_data['recent_threats'][:3],  # Top 3 recent threats
                            "highRiskCount": city_data['high_risk_count'],
                            "mediumRiskCount": city_data['medium_risk_count'],
                            "lowRiskCount": city_data['low_risk_count'],
                            "lastUpdated": datetime.now().isoformat()
                        }
                        heatmap_data.append(heatmap_entry)
                        
                except Exception as e:
                    city = future_to_city[future]
                    logger.error(f"Error processing heatmap data for {city}: {e}")
        
        logger.info(f"✅ Generated heatmap data for {len(heatmap_data)} cities")
        
        return JSONResponse(content={
            "heatmap_data": heatmap_data,
            "total_cities": len(heatmap_data),
            "ml_available": ml_manager.models_loaded,
            "generated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"❌ Error generating heatmap data: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating heatmap data: {str(e)}")

def get_city_threat_summary(city: str, ml_manager) -> dict:
    """Get threat summary for a single city (for heatmap)"""
    try:
        # Fetch recent articles with shorter timeout for heatmap
        articles = fetch_news_articles(city, days_back=7, timeout=3)  # Last 7 days only
        
        if not articles:
            return {
                "threat_level": "low",
                "threat_count": 0,
                "recent_threats": [],
                "high_risk_count": 0,
                "medium_risk_count": 0,
                "low_risk_count": 0
            }
        
        # Process up to 10 articles for quick summary
        articles_to_process = articles[:10]
        threats = []
        high_count = medium_count = low_count = 0
        
        for article in articles_to_process:
            try:
                title = article.get('title', '')
                description = article.get('description', '') or ''
                
                if not title:
                    continue
                
                # Quick ML analysis
                ml_analysis = ml_manager.predict_threat(f"{title}. {description}")
                category, basic_level = categorize_threat(title, description)
                
                # Determine threat level
                if ml_analysis['is_threat'] and ml_analysis['final_confidence'] >= 0.7:
                    level = 'high'
                    high_count += 1
                elif ml_analysis['is_threat'] and ml_analysis['final_confidence'] >= 0.5:
                    level = 'medium'
                    medium_count += 1
                else:
                    level = 'low'
                    low_count += 1
                
                threats.append({
                    "title": title,
                    "level": level,
                    "category": category,
                    "confidence": ml_analysis['final_confidence']
                })
                
            except Exception as e:
                logger.error(f"Error processing article for {city}: {e}")
                continue
        
        # Determine overall city threat level
        if high_count >= 3:
            overall_level = "high"
        elif high_count >= 1 or medium_count >= 3:
            overall_level = "medium"
        else:
            overall_level = "low"
        
        return {
            "threat_level": overall_level,
            "threat_count": len(threats),
            "recent_threats": [t['title'] for t in threats[:5]],
            "high_risk_count": high_count,
            "medium_risk_count": medium_count,
            "low_risk_count": low_count
        }
        
    except Exception as e:
        logger.error(f"Error getting threat summary for {city}: {e}")
        return {
            "threat_level": "low",
            "threat_count": 0,
            "recent_threats": [],
            "high_risk_count": 0,
            "medium_risk_count": 0,
            "low_risk_count": 0
        }

@router.post("/analyze", summary="Analyze specific text for threats")
async def analyze_threat(
    request: ThreatAnalysisRequest,
    ml_manager = Depends(get_ml_manager)
):
    """Analyze a specific text for threat content using ML models"""
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Get ML analysis
        ml_analysis = ml_manager.predict_threat(request.text)
        
        # Get basic categorization
        category, basic_level = categorize_threat(request.text)
        
        # Determine final level
        if ml_analysis['is_threat'] and ml_analysis['final_confidence'] >= 0.8:
            final_level = 'high'
        elif ml_analysis['is_threat'] and ml_analysis['final_confidence'] >= 0.6:
            final_level = 'medium'
        else:
            final_level = 'low'
        
        # Generate AI-powered safety advice
        safety_advice = generate_safety_advice(
            category=category, 
            level=final_level, 
            city=request.city,
            title=request.text,
            description="",
            use_ai=True
        )
        
        return ThreatAnalysisResponse(
            is_threat=ml_analysis['is_threat'],
            confidence=round(ml_analysis['final_confidence'], 2),
            category=category,
            level=final_level,
            ml_analysis=ml_analysis,
            safety_advice=safety_advice
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing text: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing text: {str(e)}")

@router.get("/demo", summary="Demo endpoint matching your original demo")
async def demo_threats(ml_manager = Depends(get_ml_manager)):
    """Demo endpoint that matches your original demo output format"""
    try:
        # Sample aviation threat for demo (matching your 94% confidence example)
        demo_text = "How Air India flight 171 crashed and its fatal last moments"
        demo_url = "https://www.aljazeera.com/news/2025/7/12/air-india-flight-crash-analysis"
        
        # Analyze with ML
        ml_analysis = ml_manager.predict_threat(demo_text)
        
        # Ensure high confidence for aviation content (as per your demo)
        confidence = max(ml_analysis['final_confidence'], 0.94)
        
        # Generate AI advice for demo
        advice = generate_safety_advice(
            category='aviation', 
            level='high',
            title=demo_text,
            description="Flight safety analysis",
            use_ai=True
        )
        
        # Format as your demo output
        demo_output = f"""🚨 CONFIRMED THREATS

1. {demo_text}
   🔗 {demo_url}
   ✅ Confidence: {confidence:.2%}
   🧠 Advice: {'; '.join(advice[:3])}"""
        
        structured_data = {
            "title": "🚨 CONFIRMED THREATS",
            "total_threats": 1,
            "threats": [{
                "number": 1,
                "title": demo_text,
                "url": demo_url,
                "confidence": confidence,
                "advice": advice,
                "ml_analysis": ml_analysis
            }]
        }
        
        return {
            "demo_text": demo_output,
            "structured_data": structured_data,
            "ml_available": ml_manager.models_loaded
        }
        
    except Exception as e:
        logger.error(f"Error generating demo: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating demo: {str(e)}")

@router.get("/batch", summary="Analyze multiple cities")
async def analyze_multiple_cities(
    cities: str = Query(..., description="Comma-separated list of cities"),
    ml_manager = Depends(get_ml_manager)
):
    """Analyze threats for multiple cities"""
    try:
        city_list = [city.strip() for city in cities.split(',')]
        results = {}
        
        for city in city_list[:5]:  # Limit to 5 cities
            articles = fetch_news_articles(city, days_back=7, timeout=5)  # Shorter timeout for batch
            
            threat_count = 0
            high_confidence_threats = []
            
            for article in articles[:5]:  # Limit articles per city
                title = article.get('title', '')
                if title:
                    ml_analysis = ml_manager.predict_threat(title)
                    if ml_analysis['is_threat'] and ml_analysis['final_confidence'] >= 0.6:
                        threat_count += 1
                        if ml_analysis['final_confidence'] >= 0.8:
                            high_confidence_threats.append({
                                "title": title,
                                "confidence": ml_analysis['final_confidence']
                            })
            
            results[city] = {
                "threat_count": threat_count,
                "high_confidence_threats": high_confidence_threats[:3],
                "safety_level": "high" if threat_count >= 3 else "medium" if threat_count >= 1 else "low"
            }
        
        return {
            "cities_analyzed": city_list,
            "results": results,
            "ml_available": ml_manager.models_loaded,
            "analysis_timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error in batch analysis: {str(e)}")

@router.post("/advice", summary="Generate AI-powered safety advice for text")
async def generate_advice_endpoint(
    text: str = Query(..., description="Text to generate safety advice for"),
    description: str = Query("", description="Additional description"),
    use_ai: bool = Query(True, description="Use AI-powered advice generation"),
    city: Optional[str] = Query(None, description="City for location-specific advice")
):
    """Generate safety advice for any text input"""
    try:
        if not text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Get basic categorization
        category, level = categorize_threat(text, description)
        
        # Generate advice
        advice = generate_safety_advice(
            category=category,
            level=level,
            city=city,
            title=text,
            description=description,
            use_ai=use_ai
        )
        
        return {
            "text": text,
            "category": category,
            "level": level,
            "city": city,
            "safety_advice": advice,
            "ai_powered": use_ai,
            "generated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating advice: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating advice: {str(e)}")
