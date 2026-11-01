"""Seed additional synthetic provider profiles for local marketplace testing."""

import secrets

from sqlalchemy import func

from app.main import Provider, ProviderOffering, SessionLocal, User, pwd


DEMO_PROVIDERS = [
    ("Andhra Pradesh", "Visakhapatnam", "Coastal Moments Photography", "Candid stories by the sea", "Photography", 28000, 7),
    ("Andhra Pradesh", "Vijayawada", "Krishna Celebration Catering", "Regional menus for every gathering", "Catering", 650, 9),
    ("Arunachal Pradesh", "Itanagar", "Hillside Event Decor", "Thoughtful decor inspired by the mountains", "Decoration", 22000, 6),
    ("Assam", "Guwahati", "Brahmaputra Wedding Films", "Wedding films with an Assamese touch", "Photography", 35000, 8),
    ("Assam", "Dibrugarh", "Tea Garden Celebration Catering", "Local flavours for family celebrations", "Catering", 500, 5),
    ("Chhattisgarh", "Raipur", "Raipur Rhythm Events", "DJs and sound for lively celebrations", "Music & DJ", 14000, 7),
    ("Goa", "Panaji", "Konkan Coast Event Planning", "Intimate celebrations with coastal charm", "Event Planner", 42000, 10),
    ("Gujarat", "Ahmedabad", "Aangan Wedding Decor", "Colourful wedding and garba decor", "Decoration", 32000, 9),
    ("Gujarat", "Surat", "Surat Celebration Studio", "Photo and video for life's big moments", "Photography", 26000, 6),
    ("Haryana", "Gurugram", "North Star Event Planners", "Corporate and family events, thoughtfully planned", "Event Planner", 55000, 11),
    ("Himachal Pradesh", "Shimla", "Pine & Petal Weddings", "Small mountain weddings, beautifully arranged", "Event Planner", 48000, 8),
    ("Kerala", "Kochi", "Malabar Table Catering", "Kerala menus for weddings and celebrations", "Catering", 850, 8),
    ("Kerala", "Thiruvananthapuram", "Coconut Grove Wedding Films", "Natural wedding photography and films", "Photography", 30000, 7),
    ("Madhya Pradesh", "Indore", "Indore Floral & Stage", "Fresh floral stages and celebration decor", "Decoration", 26000, 7),
    ("Madhya Pradesh", "Bhopal", "Lakeview Celebration Catering", "Buffets and regional menus for every occasion", "Catering", 600, 6),
    ("Manipur", "Imphal", "Imphal Wedding Moments", "Warm, candid coverage of local celebrations", "Photography", 21000, 5),
    ("Meghalaya", "Shillong", "Cloud Nine Live Music", "Live music and sound for memorable evenings", "Music & DJ", 17000, 6),
    ("Nagaland", "Kohima", "Kohima Event Collective", "Community-minded event planning and coordination", "Event Planner", 28000, 7),
    ("Punjab", "Amritsar", "Golden Temple City Celebrations", "Vibrant Punjabi wedding decor and coordination", "Decoration", 36000, 9),
    ("Sikkim", "Gangtok", "Himalayan Light Photography", "Mountain weddings and family event portraits", "Photography", 25000, 6),
    ("Tamil Nadu", "Chennai", "Marina City Event Planners", "Modern planning for weddings and business events", "Event Planner", 50000, 10),
    ("Tamil Nadu", "Coimbatore", "Kovai Celebration Kitchen", "South Indian catering made for sharing", "Catering", 700, 7),
    ("Telangana", "Hyderabad", "Deccan Wedding Stories", "Elegant photography for weddings and receptions", "Photography", 38000, 9),
    ("Telangana", "Warangal", "Thousand Pillars Event Decor", "Traditional and contemporary event decoration", "Decoration", 23000, 6),
    ("Tripura", "Agartala", "Agartala Occasion Makers", "Planning and coordination for family events", "Event Planner", 19000, 5),
    ("Uttarakhand", "Dehradun", "Doon Valley Wedding Co.", "Destination wedding planning in the foothills", "Event Planner", 46000, 8),
    ("Jammu and Kashmir", "Srinagar", "Valley Celebration Photography", "Wedding photography across the Kashmir Valley", "Photography", 33000, 7),
    ("Ladakh", "Leh", "High Pass Event Coordination", "Small celebrations planned for high-altitude venues", "Event Planner", 52000, 6),
    ("Puducherry", "Puducherry", "French Quarter Celebration Studio", "Intimate event styling and coordination", "Decoration", 27000, 7),
    ("Andaman and Nicobar Islands", "Port Blair", "Island Tide Event Services", "Island celebrations with local event support", "Event Planner", 39000, 6),
    ("Chandigarh", "Chandigarh", "City Beautiful Makeup Studio", "Bridal and occasion makeup services", "Makeup", 12000, 8),
]


def demo_price_unit(provider_type: str) -> str:
    if provider_type == "Catering":
        return "plate"
    if provider_type == "Photography":
        return "day"
    return "event"


def ensure_demo_offering(session, provider: Provider, starting_price: float) -> None:
    title = f"{provider.provider_type} sample service - {provider.city}"
    if session.query(ProviderOffering.id).filter_by(
        provider_id=provider.id,
        title=title,
    ).first():
        return
    session.add(
        ProviderOffering(
            provider_id=provider.id,
            title=title,
            category=provider.provider_type[:60],
            description=(
                f"Synthetic example for {provider.city}, {provider.state}. "
                "Not a verified market rate; confirm scope and final price with "
                "the provider."
            ),
            inclusions="Example scope only; confirm inclusions and availability.",
            price=starting_price,
            price_unit=demo_price_unit(provider.provider_type),
            minimum_quantity=50 if provider.provider_type == "Catering" else None,
            event_types='["Wedding","Birthday","Engagement","Anniversary","Family celebration"]',
            all_events=False,
        )
    )


def seed_demo_providers() -> tuple[int, int]:
    created = 0
    skipped = 0
    with SessionLocal() as session:
        for index, (
            state,
            city,
            business_name,
            business_title,
            provider_type,
            starting_price,
            years_experience,
        ) in enumerate(DEMO_PROVIDERS, start=1):
            email = f"demo.provider.india.{index:03d}@eventhub.local"
            existing_user = (
                session.query(User)
                .filter(func.lower(User.email) == email.lower())
                .first()
            )
            if existing_user:
                existing_provider = (
                    session.query(Provider)
                    .filter_by(user_id=existing_user.id)
                    .first()
                )
                if existing_provider:
                    existing_provider.starting_price = starting_price
                    existing_provider.price_unit = demo_price_unit(provider_type)
                    if "not a verified market rate" not in existing_provider.description.lower():
                        existing_provider.description = (
                            existing_provider.description.rstrip()
                            + " Synthetic demo listing; sample starting prices are "
                            "not verified market rates."
                        )
                    ensure_demo_offering(session, existing_provider, starting_price)
                    skipped += 1
                    continue
                raise RuntimeError(
                    f"Cannot seed {email}: an account with this email exists "
                    "without a provider profile."
                )

            user = User(
                name=f"Demo Provider {index:03d}",
                email=email,
                phone=f"90000{index:05d}",
                password_hash=pwd.hash(secrets.token_urlsafe(32)),
                role="PROVIDER",
                email_verified=False,
                active=True,
            )
            session.add(user)
            session.flush()
            session.add(
                Provider(
                    user_id=user.id,
                    business_name=business_name,
                    business_title=business_title,
                    category=provider_type,
                    provider_type=provider_type,
                    city=city,
                    state=state,
                    description=(
                        "Synthetic demo listing and sample prices for local EventHub "
                        "testing; not a real business or verified market rates. "
                        "Contact details and social profiles are intentionally not provided."
                    ),
                    service_radius=50,
                    years_experience=years_experience,
                    starting_price=starting_price,
                    price_unit=demo_price_unit(provider_type),
                    rating=0,
                    review_count=0,
                    verified=False,
                    verification_status="PENDING",
                )
            )
            session.flush()
            provider = session.query(Provider).filter_by(user_id=user.id).first()
            ensure_demo_offering(session, provider, starting_price)
            created += 1
        session.commit()
    return created, skipped


if __name__ == "__main__":
    created_count, skipped_count = seed_demo_providers()
    print(
        f"Demo provider seeding complete: {created_count} created, "
        f"{skipped_count} already present."
    )
