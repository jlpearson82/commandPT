import AccessControl "authorization/access-control";
import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

persistent actor CommandPT {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();

  // Initialize auth (first caller becomes admin, others become users)
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check happens inside assignRole
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public type UserProfile = {
    name : Text;
  };

  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  var userProfiles = principalMap.empty<UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  // Equipment Inventory Types
  public type EquipmentStatus = {
    #available;
    #rented;
    #maintenance;
  };

  public type EquipmentLocation = {
    #dallas;
    #miami;
    #phoenix;
    #minneapolis;
  };

  public type Category = {
    #lighting;
    #audio;
    #video;
    #cable;
    #drape;
    #miscellaneous;
  };

  public type CatalogItem = {
    item_id : Nat;
    name : Text;
    category : Category;
    description : Text;
    price : Nat;
    item_photo : ?Storage.ExternalBlob;
  };

  public type AssetUnit = {
    asset_unit_id : Nat;
    item_id : Nat;
    asset_tag : Text;
    office_location : EquipmentLocation;
    status : EquipmentStatus;
    notes : ?Text;
  };

  // Venue Types
  public type Venue = {
    venue_id : Nat;
    venue_name : Text;
    address_line_1 : Text;
    address_line_2 : Text;
    city : Text;
    state : Text;
    postal_code : Text;
    country : Text;
    phone : ?Text;
    website : ?Text;
    notes : ?Text;
  };

  // Client Types
  public type Client = {
    id : Nat;
    name : Text;
    company : Text;
    phone : Text;
    email : Text;
  };

  // Quote Types
  public type QuoteStatus = {
    #draft;
    #sent;
    #approved;
    #rejected;
  };

  public type QuoteItem = {
    equipmentId : ?Nat;
    quantity : Nat;
    pricePerDayCents : Nat;
    description : ?Text;
    numberOfDays : Nat;
    isCustom : Bool;
    customName : ?Text;
    customCategory : ?Text;
  };

  public type QuoteSection = {
    name : Text;
    items : [QuoteItem];
    subtotalCents : Nat;
    taxCents : Nat;
    totalCents : Nat;
    tax_enabled : Bool;
    tax_rate : Nat;
  };

  public type Quote = {
    id : Nat;
    clientId : Nat;
    venue_id : ?Nat;
    event_start_date : Text;
    event_end_date : ?Text;
    createdBy : Principal;
    sections : [QuoteSection];
    subtotalCents : Nat;
    taxCents : Nat;
    totalCents : Nat;
    status : QuoteStatus;
    referenceNumber : Text;
    office : EquipmentLocation;
  };

  // Booking Types
  public type Booking = {
    id : Nat;
    equipmentId : Nat;
    clientId : Nat;
    startDate : Text;
    endDate : Text;
    status : Text;
  };

  // Vendor Types
  public type VendorCategory = {
    #equipment;
    #labor;
    #laborAndEquipment;
    #transportation;
    #miscellaneous;
  };

  public type Vendor = {
    id : Nat;
    name : Text;
    primaryContactName : Text;
    email : Text;
    phoneNumber : Text;
    address : ?Text;
    notes : ?Text;
    vendor_category : VendorCategory;
  };

  // Subrental Types
  public type Subrental = {
    id : Nat;
    quoteId : Nat;
    vendorId : Nat;
    itemId : Nat;
    quantity : Nat;
  };

  // Cost Types
  public type Cost = {
    cost_id : Nat;
    job_id : Nat;
    vendor_id : Nat;
    vendor_category : VendorCategory;
    projected_cost : Nat;
    actual_cost : Nat;
    notes : ?Text;
  };

  // Storage
  transient let natMap = OrderedMap.Make<Nat>(Nat.compare);
  transient let textMap = OrderedMap.Make<Text>(Text.compare);

  var catalogItems = natMap.empty<CatalogItem>();
  var assetUnits = natMap.empty<AssetUnit>();
  var venues = natMap.empty<Venue>();
  var clients = natMap.empty<Client>();
  var quotes = natMap.empty<Quote>();
  var bookings = natMap.empty<Booking>();
  var vendors = natMap.empty<Vendor>();
  var subrentals = natMap.empty<Subrental>();
  var costs = natMap.empty<Cost>();

  var nextCatalogItemId = 0;
  var nextAssetUnitId = 0;
  var nextVenueId = 0;
  var nextClientId = 0;
  var nextQuoteId = 0;
  var nextBookingId = 0;
  var nextVendorId = 0;
  var nextSubrentalId = 0;
  var nextCostId = 0;

  // Catalog Item Functions
  public shared ({ caller }) func addCatalogItem(item : CatalogItem) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add catalog items");
    };

    let newItem : CatalogItem = {
      item_id = nextCatalogItemId;
      name = item.name;
      category = item.category;
      description = item.description;
      price = item.price;
      item_photo = item.item_photo;
    };

    catalogItems := natMap.put(catalogItems, nextCatalogItemId, newItem);
    nextCatalogItemId += 1;
    nextCatalogItemId - 1;
  };

  public query ({ caller }) func getCatalogItem(id : Nat) : async ?CatalogItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view catalog items");
    };
    natMap.get(catalogItems, id);
  };

  public query ({ caller }) func getAllCatalogItems() : async [CatalogItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view catalog items");
    };
    Iter.toArray(natMap.vals(catalogItems));
  };

  public shared ({ caller }) func updateCatalogItem(id : Nat, item : CatalogItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update catalog items");
    };

    switch (natMap.get(catalogItems, id)) {
      case (null) { Debug.trap("Catalog item not found") };
      case (?_) {
        let updatedItem : CatalogItem = {
          item_id = id;
          name = item.name;
          category = item.category;
          description = item.description;
          price = item.price;
          item_photo = item.item_photo;
        };
        catalogItems := natMap.put(catalogItems, id, updatedItem);
      };
    };
  };

  public shared ({ caller }) func deleteCatalogItem(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete catalog items");
    };

    catalogItems := natMap.delete(catalogItems, id);
  };

  // Asset Unit Functions
  public shared ({ caller }) func addAssetUnit(unit : AssetUnit) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add asset units");
    };

    // Check for duplicate asset tag
    for ((_, existingUnit) in natMap.entries(assetUnits)) {
      if (existingUnit.asset_tag == unit.asset_tag) {
        Debug.trap("Duplicate asset tag: " # unit.asset_tag);
      };
    };

    let newUnit : AssetUnit = {
      asset_unit_id = nextAssetUnitId;
      item_id = unit.item_id;
      asset_tag = unit.asset_tag;
      office_location = unit.office_location;
      status = unit.status;
      notes = unit.notes;
    };

    assetUnits := natMap.put(assetUnits, nextAssetUnitId, newUnit);
    nextAssetUnitId += 1;
    nextAssetUnitId - 1;
  };

  public query ({ caller }) func getAssetUnit(id : Nat) : async ?AssetUnit {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view asset units");
    };
    natMap.get(assetUnits, id);
  };

  public query ({ caller }) func getAllAssetUnits() : async [AssetUnit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view asset units");
    };
    Iter.toArray(natMap.vals(assetUnits));
  };

  public query ({ caller }) func getAssetUnitsByItemId(itemId : Nat) : async [AssetUnit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view asset units");
    };
    let filtered = Iter.filter(
      natMap.vals(assetUnits),
      func(unit : AssetUnit) : Bool {
        unit.item_id == itemId;
      },
    );
    Iter.toArray(filtered);
  };

  public shared ({ caller }) func updateAssetUnit(id : Nat, unit : AssetUnit) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update asset units");
    };

    switch (natMap.get(assetUnits, id)) {
      case (null) { Debug.trap("Asset unit not found") };
      case (?existingUnit) {
        // Check for duplicate asset tag if tag is being changed
        if (existingUnit.asset_tag != unit.asset_tag) {
          for ((unitId, otherUnit) in natMap.entries(assetUnits)) {
            if (unitId != id and otherUnit.asset_tag == unit.asset_tag) {
              Debug.trap("Duplicate asset tag: " # unit.asset_tag);
            };
          };
        };

        let updatedUnit : AssetUnit = {
          asset_unit_id = id;
          item_id = unit.item_id;
          asset_tag = unit.asset_tag;
          office_location = unit.office_location;
          status = unit.status;
          notes = unit.notes;
        };
        assetUnits := natMap.put(assetUnits, id, updatedUnit);
      };
    };
  };

  public shared ({ caller }) func deleteAssetUnit(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete asset units");
    };

    assetUnits := natMap.delete(assetUnits, id);
  };

  // Venue Management Functions
  public shared ({ caller }) func addVenue(venue : Venue) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add venues");
    };

    let newVenue : Venue = {
      venue_id = nextVenueId;
      venue_name = venue.venue_name;
      address_line_1 = venue.address_line_1;
      address_line_2 = venue.address_line_2;
      city = venue.city;
      state = venue.state;
      postal_code = venue.postal_code;
      country = venue.country;
      phone = venue.phone;
      website = venue.website;
      notes = venue.notes;
    };

    venues := natMap.put(venues, nextVenueId, newVenue);
    nextVenueId += 1;
    nextVenueId - 1;
  };

  public query ({ caller }) func getVenue(id : Nat) : async ?Venue {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view venues");
    };
    natMap.get(venues, id);
  };

  public query ({ caller }) func getAllVenues() : async [Venue] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view venues");
    };
    Iter.toArray(natMap.vals(venues));
  };

  public query ({ caller }) func searchVenues(searchTerm : Text) : async [Venue] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can search venues");
    };
    let filtered = Iter.filter(
      natMap.vals(venues),
      func(venue : Venue) : Bool {
        Text.contains(Text.toLowercase(venue.venue_name), #text(Text.toLowercase(searchTerm))) or
        Text.contains(Text.toLowercase(venue.city), #text(Text.toLowercase(searchTerm))) or
        Text.contains(Text.toLowercase(venue.state), #text(Text.toLowercase(searchTerm)));
      },
    );
    Iter.toArray(filtered);
  };

  public shared ({ caller }) func updateVenue(id : Nat, venue : Venue) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update venues");
    };

    switch (natMap.get(venues, id)) {
      case (null) { Debug.trap("Venue not found") };
      case (?_) {
        let updatedVenue : Venue = {
          venue_id = id;
          venue_name = venue.venue_name;
          address_line_1 = venue.address_line_1;
          address_line_2 = venue.address_line_2;
          city = venue.city;
          state = venue.state;
          postal_code = venue.postal_code;
          country = venue.country;
          phone = venue.phone;
          website = venue.website;
          notes = venue.notes;
        };
        venues := natMap.put(venues, id, updatedVenue);
      };
    };
  };

  public shared ({ caller }) func deleteVenue(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete venues");
    };

    venues := natMap.delete(venues, id);
  };

  // Client Management Functions
  public shared ({ caller }) func addClient(client : Client) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add clients");
    };

    let newClient : Client = {
      id = nextClientId;
      name = client.name;
      company = client.company;
      phone = client.phone;
      email = client.email;
    };

    clients := natMap.put(clients, nextClientId, newClient);
    nextClientId += 1;
    nextClientId - 1;
  };

  public query ({ caller }) func getClient(id : Nat) : async ?Client {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view clients");
    };
    natMap.get(clients, id);
  };

  public query ({ caller }) func getAllClients() : async [Client] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view clients");
    };
    Iter.toArray(natMap.vals(clients));
  };

  public shared ({ caller }) func updateClient(id : Nat, client : Client) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update clients");
    };

    switch (natMap.get(clients, id)) {
      case (null) { Debug.trap("Client not found") };
      case (?_) {
        let updatedClient : Client = {
          id;
          name = client.name;
          company = client.company;
          phone = client.phone;
          email = client.email;
        };
        clients := natMap.put(clients, id, updatedClient);
      };
    };
  };

  public shared ({ caller }) func deleteClient(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete clients");
    };

    clients := natMap.delete(clients, id);
  };

  // Quote Management Functions
  public shared ({ caller }) func createQuote(quote : Quote) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can create quotes");
    };

    let newQuote : Quote = {
      id = nextQuoteId;
      clientId = quote.clientId;
      venue_id = quote.venue_id;
      event_start_date = quote.event_start_date;
      event_end_date = quote.event_end_date;
      createdBy = caller;
      sections = quote.sections;
      subtotalCents = quote.subtotalCents;
      taxCents = quote.taxCents;
      totalCents = quote.totalCents;
      status = quote.status;
      referenceNumber = quote.referenceNumber;
      office = quote.office;
    };

    quotes := natMap.put(quotes, nextQuoteId, newQuote);
    nextQuoteId += 1;
    nextQuoteId - 1;
  };

  public query ({ caller }) func getQuote(id : Nat) : async ?Quote {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view quotes");
    };
    // Organization-wide visibility: all users can view all quotes
    natMap.get(quotes, id);
  };

  public query ({ caller }) func getAllQuotes() : async [Quote] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view quotes");
    };
    // Organization-wide visibility: all users can view all quotes
    Iter.toArray(natMap.vals(quotes));
  };

  public shared ({ caller }) func updateQuote(id : Nat, quote : Quote) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update quotes");
    };

    switch (natMap.get(quotes, id)) {
      case (null) { Debug.trap("Quote not found") };
      case (?existingQuote) {
        // Users can only update their own quotes, admins can update any
        if (existingQuote.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only update your own quotes");
        };

        let updatedQuote : Quote = {
          id;
          clientId = quote.clientId;
          venue_id = quote.venue_id;
          event_start_date = quote.event_start_date;
          event_end_date = quote.event_end_date;
          createdBy = existingQuote.createdBy;
          sections = quote.sections;
          subtotalCents = quote.subtotalCents;
          taxCents = quote.taxCents;
          totalCents = quote.totalCents;
          status = quote.status;
          referenceNumber = quote.referenceNumber;
          office = quote.office;
        };
        quotes := natMap.put(quotes, id, updatedQuote);
      };
    };
  };

  public shared ({ caller }) func deleteQuote(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete quotes");
    };

    switch (natMap.get(quotes, id)) {
      case (null) { Debug.trap("Quote not found") };
      case (?existingQuote) {
        // Users can only delete their own quotes, admins can delete any
        if (existingQuote.createdBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Debug.trap("Unauthorized: Can only delete your own quotes");
        };
        quotes := natMap.delete(quotes, id);
      };
    };
  };

  // Booking Management Functions
  public shared ({ caller }) func addBooking(booking : Booking) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add bookings");
    };

    let newBooking : Booking = {
      id = nextBookingId;
      equipmentId = booking.equipmentId;
      clientId = booking.clientId;
      startDate = booking.startDate;
      endDate = booking.endDate;
      status = booking.status;
    };

    bookings := natMap.put(bookings, nextBookingId, newBooking);
    nextBookingId += 1;
    nextBookingId - 1;
  };

  public query ({ caller }) func getBooking(id : Nat) : async ?Booking {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view bookings");
    };
    natMap.get(bookings, id);
  };

  public query ({ caller }) func getAllBookings() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view bookings");
    };
    Iter.toArray(natMap.vals(bookings));
  };

  public shared ({ caller }) func updateBooking(id : Nat, booking : Booking) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update bookings");
    };

    switch (natMap.get(bookings, id)) {
      case (null) { Debug.trap("Booking not found") };
      case (?_) {
        let updatedBooking : Booking = {
          id;
          equipmentId = booking.equipmentId;
          clientId = booking.clientId;
          startDate = booking.startDate;
          endDate = booking.endDate;
          status = booking.status;
        };
        bookings := natMap.put(bookings, id, updatedBooking);
      };
    };
  };

  public shared ({ caller }) func deleteBooking(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete bookings");
    };

    bookings := natMap.delete(bookings, id);
  };

  // Vendor Management Functions
  public shared ({ caller }) func addVendor(vendor : Vendor) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add vendors");
    };

    let newVendor : Vendor = {
      id = nextVendorId;
      name = vendor.name;
      primaryContactName = vendor.primaryContactName;
      email = vendor.email;
      phoneNumber = vendor.phoneNumber;
      address = vendor.address;
      notes = vendor.notes;
      vendor_category = vendor.vendor_category;
    };

    vendors := natMap.put(vendors, nextVendorId, newVendor);
    nextVendorId += 1;
    nextVendorId - 1;
  };

  public query ({ caller }) func getVendor(id : Nat) : async ?Vendor {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view vendors");
    };
    natMap.get(vendors, id);
  };

  public query ({ caller }) func getAllVendors() : async [Vendor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view vendors");
    };
    Iter.toArray(natMap.vals(vendors));
  };

  public shared ({ caller }) func updateVendor(id : Nat, vendor : Vendor) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update vendors");
    };

    switch (natMap.get(vendors, id)) {
      case (null) { Debug.trap("Vendor not found") };
      case (?_) {
        let updatedVendor : Vendor = {
          id;
          name = vendor.name;
          primaryContactName = vendor.primaryContactName;
          email = vendor.email;
          phoneNumber = vendor.phoneNumber;
          address = vendor.address;
          notes = vendor.notes;
          vendor_category = vendor.vendor_category;
        };
        vendors := natMap.put(vendors, id, updatedVendor);
      };
    };
  };

  public shared ({ caller }) func deleteVendor(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete vendors");
    };

    vendors := natMap.delete(vendors, id);
  };

  // Subrental Management Functions
  public shared ({ caller }) func addSubrental(subrental : Subrental) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add subrentals");
    };

    let newSubrental : Subrental = {
      id = nextSubrentalId;
      quoteId = subrental.quoteId;
      vendorId = subrental.vendorId;
      itemId = subrental.itemId;
      quantity = subrental.quantity;
    };

    subrentals := natMap.put(subrentals, nextSubrentalId, newSubrental);
    nextSubrentalId += 1;
    nextSubrentalId - 1;
  };

  public query ({ caller }) func getSubrental(id : Nat) : async ?Subrental {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view subrentals");
    };
    natMap.get(subrentals, id);
  };

  public query ({ caller }) func getAllSubrentals() : async [Subrental] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view subrentals");
    };
    Iter.toArray(natMap.vals(subrentals));
  };

  public query ({ caller }) func getSubrentalsByQuoteId(quoteId : Nat) : async [Subrental] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view subrentals");
    };
    let filtered = Iter.filter(
      natMap.vals(subrentals),
      func(subrental : Subrental) : Bool {
        subrental.quoteId == quoteId;
      },
    );
    Iter.toArray(filtered);
  };

  public shared ({ caller }) func updateSubrental(id : Nat, subrental : Subrental) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update subrentals");
    };

    switch (natMap.get(subrentals, id)) {
      case (null) { Debug.trap("Subrental not found") };
      case (?_) {
        let updatedSubrental : Subrental = {
          id;
          quoteId = subrental.quoteId;
          vendorId = subrental.vendorId;
          itemId = subrental.itemId;
          quantity = subrental.quantity;
        };
        subrentals := natMap.put(subrentals, id, updatedSubrental);
      };
    };
  };

  public shared ({ caller }) func deleteSubrental(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete subrentals");
    };

    subrentals := natMap.delete(subrentals, id);
  };

  // Cost Management Functions
  public shared ({ caller }) func addCost(cost : Cost) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can add costs");
    };

    let newCost : Cost = {
      cost_id = nextCostId;
      job_id = cost.job_id;
      vendor_id = cost.vendor_id;
      vendor_category = cost.vendor_category;
      projected_cost = cost.projected_cost;
      actual_cost = cost.actual_cost;
      notes = cost.notes;
    };

    costs := natMap.put(costs, nextCostId, newCost);
    nextCostId += 1;
    nextCostId - 1;
  };

  public query ({ caller }) func getCost(id : Nat) : async ?Cost {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view costs");
    };
    natMap.get(costs, id);
  };

  public query ({ caller }) func getAllCosts() : async [Cost] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view costs");
    };
    Iter.toArray(natMap.vals(costs));
  };

  public query ({ caller }) func getCostsByJobId(jobId : Nat) : async [Cost] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view costs");
    };
    let filtered = Iter.filter(
      natMap.vals(costs),
      func(cost : Cost) : Bool {
        cost.job_id == jobId;
      },
    );
    Iter.toArray(filtered);
  };

  public shared ({ caller }) func updateCost(id : Nat, cost : Cost) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can update costs");
    };

    switch (natMap.get(costs, id)) {
      case (null) { Debug.trap("Cost not found") };
      case (?_) {
        let updatedCost : Cost = {
          cost_id = id;
          job_id = cost.job_id;
          vendor_id = cost.vendor_id;
          vendor_category = cost.vendor_category;
          projected_cost = cost.projected_cost;
          actual_cost = cost.actual_cost;
          notes = cost.notes;
        };
        costs := natMap.put(costs, id, updatedCost);
      };
    };
  };

  public shared ({ caller }) func deleteCost(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete costs");
    };

    costs := natMap.delete(costs, id);
  };

  // CSV Import Functionality
  public shared ({ caller }) func importCsvData(csvData : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can import CSV data");
    };

    let lines = Text.split(csvData, #char '\n');
    var catalogMap = textMap.empty<CatalogItem>();
    var assetList : [AssetUnit] = [];

    for (line in lines) {
      let fields = Text.split(line, #char ',');
      let fieldsArray = Iter.toArray(fields);

      if (fieldsArray.size() >= 7) {
        let itemName = fieldsArray[0];
        let categoryText = fieldsArray[1];
        let description = fieldsArray[2];
        let priceText = fieldsArray[3];
        let assetTag = fieldsArray[4];
        let locationText = fieldsArray[5];
        let notes = fieldsArray[6];

        // Check for duplicate asset tag before processing
        var isDuplicate = false;
        for ((_, existingUnit) in natMap.entries(assetUnits)) {
          if (existingUnit.asset_tag == assetTag) {
            isDuplicate := true;
          };
        };

        if (not isDuplicate) {
          let location : EquipmentLocation = switch (locationText) {
            case ("Dallas") { #dallas };
            case ("Miami") { #miami };
            case ("Phoenix") { #phoenix };
            case ("Minneapolis") { #minneapolis };
            case (_) { #dallas };
          };

          let category : Category = switch (categoryText) {
            case ("Lighting") { #lighting };
            case ("Audio") { #audio };
            case ("Video") { #video };
            case ("Cable") { #cable };
            case ("Drape") { #drape };
            case ("Miscellaneous") { #miscellaneous };
            case (_) { #miscellaneous };
          };

          let price = switch (Nat.fromText(priceText)) {
            case (?p) { p };
            case (null) { 0 };
          };

          var itemId = 0;
          switch (textMap.get(catalogMap, itemName)) {
            case (null) {
              let catalogItem : CatalogItem = {
                item_id = nextCatalogItemId;
                name = itemName;
                category;
                description;
                price;
                item_photo = null;
              };
              catalogMap := textMap.put(catalogMap, itemName, catalogItem);
              catalogItems := natMap.put(catalogItems, nextCatalogItemId, catalogItem);
              itemId := nextCatalogItemId;
              nextCatalogItemId += 1;
            };
            case (?existingItem) {
              itemId := existingItem.item_id;
            };
          };

          let assetUnit : AssetUnit = {
            asset_unit_id = nextAssetUnitId;
            item_id = itemId;
            asset_tag = assetTag;
            office_location = location;
            status = #available;
            notes = ?notes;
          };

          assetList := Array.append(assetList, [assetUnit]);
          assetUnits := natMap.put(assetUnits, nextAssetUnitId, assetUnit);
          nextAssetUnitId += 1;
        };
      };
    };
  };

  // Operations Functions
  public query ({ caller }) func getConfirmedQuotes() : async [Quote] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view confirmed quotes");
    };
    let filtered = Iter.filter(
      natMap.vals(quotes),
      func(quote : Quote) : Bool {
        quote.status == #approved;
      },
    );
    Iter.toArray(filtered);
  };

  public query ({ caller }) func getAvailableQuantity(itemId : Nat, location : EquipmentLocation) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view available quantity");
    };
    var count = 0;
    for ((_, unit) in natMap.entries(assetUnits)) {
      if (unit.item_id == itemId and unit.office_location == location and unit.status == #available) {
        count += 1;
      };
    };
    count;
  };

  public query ({ caller }) func calculateShortage(itemId : Nat, location : EquipmentLocation, requiredQuantity : Nat) : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can calculate shortage");
    };
    var available = 0;
    for ((_, unit) in natMap.entries(assetUnits)) {
      if (unit.item_id == itemId and unit.office_location == location and unit.status == #available) {
        available += 1;
      };
    };
    let shortage = available - requiredQuantity;
    shortage;
  };

  // Clear Inventory Data Function
  public shared ({ caller }) func clearInventoryData() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can clear inventory data");
    };

    catalogItems := natMap.empty<CatalogItem>();
    assetUnits := natMap.empty<AssetUnit>();
    nextCatalogItemId := 0;
    nextAssetUnitId := 0;
  };

  // Download CSV Template Function
  public query ({ caller }) func getCsvTemplate() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can download CSV template");
    };

    let headers = "item_name,category,description,price,asset_tag,location,notes\n";
    let exampleRows = "LED Par Light,Lighting,High output LED par can,1000,PAR-001,Miami,LED par light\n" #
    "Wireless Microphone,Audio,Handheld wireless mic,500,MIC-001,Dallas,Wireless microphone\n" #
    "Projector,Video,5000 lumen projector,2000,PROJ-001,Phoenix,Projector\n" #
    "XLR Cable,Cable,20ft XLR cable,100,CABLE-001,Minneapolis,XLR cable\n" #
    "Black Drape,Drape,Black velour drape,500,DRAPE-001,Miami,Black drape\n" #
    "Gaffer Tape,Miscellaneous,Black gaffer tape,50,TAPE-001,Dallas,Gaffer tape\n";

    headers # exampleRows;
  };

  // Image Storage
  let storage = Storage.new();
  include MixinStorage(storage);
};

