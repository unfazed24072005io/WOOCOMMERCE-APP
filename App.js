import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Modal,
  Animated,
  RefreshControl,
  SafeAreaView,
  Platform,
  Linking,
  Vibration,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const API_URL = "https://demo.whoiam.in/wp-json/wc/v3";
const CONSUMER_KEY = "ck_b9f411e2e0d7a352bdfdbf86aac98335d1e44379";
const CONSUMER_SECRET = "cs_5174ac3c43c4ea980cfafd9327308d15939dfaf0";

// API Functions
const fetchProducts = async () => {
  try {
    const url = `${API_URL}/products?per_page=50&consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};

// Cart Context
const CartContext = createContext();
const WishlistContext = createContext();

// ========== HOME SCREEN (FIXED SCROLLING) ==========
const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { addToCart } = useContext(CartContext);
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let filtered = products;
    if (searchQuery) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.categories?.some(c => c.id === selectedCategory));
    }
    setFilteredProducts(filtered);
  }, [searchQuery, products, selectedCategory]);

  const loadProducts = async () => {
    const data = await fetchProducts();
    setProducts(data);
    setFilteredProducts(data);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const categories = [
    { id: 'all', name: 'All', icon: 'apps-outline' },
    { id: 24, name: 'Groceries', icon: 'basket-outline' },
    { id: 25, name: 'Juice', icon: 'cafe-outline' },
  ];

  const ProductCard = ({ item, index }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 500, delay: index * 100, useNativeDriver: true })
      ]).start();
    }, []);

    return (
  <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }], width: '50%' }}>
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('ProductDetail', { product: { ...item, price: parseFloat(item.price) } })}
      style={styles.productCard}
    >
      <View style={styles.productImageContainer}>
        <Image source={{ uri: item.images?.[0]?.src }} style={styles.productImage} />
        {item.sale_price && (
          <View style={styles.saleTag}>
            <Text style={styles.saleTagText}>SALE</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={() => isInWishlist(item.id) ? removeFromWishlist(item.id) : addToWishlist(item)}
        >
          <Ionicons name={isInWishlist(item.id) ? 'heart' : 'heart-outline'} size={22} color={isInWishlist(item.id) ? '#ff4444' : '#fff'} />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          {item.regular_price && item.regular_price !== item.price && (
            <Text style={styles.originalPrice}>₹{item.regular_price}</Text>
          )}
        </View>
        <View style={styles.productFooter}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={styles.ratingText}>{item.average_rating || '4.5'}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => { 
              // FIX: Parse price when adding to cart
              const productWithParsedPrice = { 
                ...item, 
                price: parseFloat(item.price) 
              };
              addToCart(productWithParsedPrice); 
              Vibration.vibrate(50); 
            }}
          >
            <Ionicons name="cart-outline" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  </Animated.View>
);
  };

  const CategoryItem = ({ cat }) => {
    const isSelected = selectedCategory === cat.id;
    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
        onPress={() => setSelectedCategory(cat.id)}
      >
        <View style={[styles.categoryIcon, isSelected && styles.categoryIconSelected]}>
          <Ionicons name={cat.icon} size={24} color={isSelected ? '#fff' : '#6200ee'} />
        </View>
        <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>{cat.name}</Text>
      </TouchableOpacity>
    );
  };

  const Header = () => {
    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>Shopper! 👋</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => navigation.navigate('Wishlist')} style={styles.headerIcon}>
              <Ionicons name="heart-outline" size={24} color="#333" />
              {wishlist.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{wishlist.length}</Text></View>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.headerIcon}>
              <Ionicons name="cart-outline" size={24} color="#333" />
              <CartCounter />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>
    );
  };

  const CartCounter = () => {
    const { getItemCount } = useContext(CartContext);
    const count = getItemCount();
    if (count === 0) return null;
    return <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>;
  };

  const renderHeader = () => (
    <>
      <Header />
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((cat) => <CategoryItem key={cat.id} cat={cat} />)}
      </ScrollView>
      
      {/* Banner */}
      <TouchableOpacity style={styles.bannerContainer} activeOpacity={0.9}>
        <Image source={{ uri: 'https://img.freepik.com/free-vector/flat-sale-banner-template-with-shopping-bags_23-2149303039.jpg' }} style={styles.bannerImage} />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>Big Sale!</Text>
          <Text style={styles.bannerSubtitle}>Up to 50% off</Text>
          <View style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>Shop Now →</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔥 Featured Products</Text>
        <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading amazing products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        showsVerticalScrollIndicator={true}
        renderItem={({ item, index }) => <ProductCard item={item} index={index} />}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />}
        contentContainerStyle={styles.productsGrid}
        columnWrapperStyle={styles.columnWrapper}
        removeClippedSubviews={false}
      />
    </SafeAreaView>
  );
};

// ========== PRODUCT DETAIL SCREEN ==========
const ProductDetailScreen = ({ route, navigation }) => {
  const { product: initialProduct } = route.params;
  const [product, setProduct] = useState(initialProduct);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useContext(CartContext);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useContext(WishlistContext);

  const updateQuantity = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= 99) setQuantity(newQty);
  };

  const handleAddToCart = () => {
    addToCart({ ...product, quantity });
    Alert.alert('Success', `${quantity} × ${product.name} added to cart`);
  };

  // FOR WEB - Use native HTML elements
  if (Platform.OS === 'web') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ 
          padding: '15px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'white'
        }}>
          <button onClick={() => navigation.goBack()} style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '24px', 
            cursor: 'pointer',
            padding: '8px'
          }}>←</button>
          <div style={{ fontSize: '18px', fontWeight: 'bold', flex: 1 }}>{product.name}</div>
          <button onClick={() => isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product)} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            color: isInWishlist(product.id) ? '#ff4444' : '#333'
          }}>♥</button>
        </div>

        {/* Scrollable content - THIS IS THE KEY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Images */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '20px' }}>
            {(product.images?.length ? product.images : [{ src: 'https://via.placeholder.com/400' }]).map((img, idx) => (
              <img key={idx} src={img.src} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '10px' }} />
            ))}
          </div>

          {/* Product Info */}
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>{product.name}</h1>
          
          <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50' }}>₹{product.price}</span>
            {product.regular_price && product.regular_price !== product.price && (
              <span style={{ fontSize: '18px', color: '#999', textDecoration: 'line-through', marginLeft: '12px' }}>₹{product.regular_price}</span>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <span style={{ 
              padding: '6px 12px', 
              borderRadius: '20px', 
              backgroundColor: product.stock_status === 'instock' ? '#E8F5E9' : '#FFEBEE',
              display: 'inline-block'
            }}>
              {product.stock_status === 'instock' ? '✓ In Stock' : '✗ Out of Stock'}
            </span>
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Quantity:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button onClick={() => updateQuantity(-1)} style={{ width: '40px', height: '40px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '8px', fontSize: '20px', cursor: 'pointer' }}>-</button>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{quantity}</span>
              <button onClick={() => updateQuantity(1)} style={{ width: '40px', height: '40px', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '8px', fontSize: '20px', cursor: 'pointer' }}>+</button>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '25px' }}>
            <button onClick={handleAddToCart} style={{ 
              flex: 1, 
              backgroundColor: '#6200ee', 
              color: 'white', 
              padding: '15px', 
              borderRadius: '12px', 
              border: 'none', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              🛒 Add to Cart
            </button>
          </div>

          <hr style={{ marginVertical: '20px' }} />

          {/* Description */}
          <h3>📝 Description</h3>
          <p style={{ lineHeight: '1.6', color: '#666', marginBottom: '20px' }}>
            {product.description?.replace(/<[^>]*>/g, '') || 'No description available'}
          </p>

          {/* Categories */}
          {product.categories?.length > 0 && (
            <>
              <h3>📂 Categories</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '100px' }}>
                {product.categories.map(cat => (
                  <span key={cat.id} style={{ backgroundColor: '#f0f0f0', padding: '6px 12px', borderRadius: '15px', fontSize: '13px' }}>
                    {cat.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // FOR MOBILE - Keep your original code
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 15, 
        paddingTop: Platform.OS === 'ios' ? 50 : 15, 
        paddingBottom: 15, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#f0f0f0' 
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center' }} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity 
          onPress={() => isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product)}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}
        >
          <Ionicons name={isInWishlist(product.id) ? 'heart' : 'heart-outline'} size={24} color={isInWishlist(product.id) ? '#ff4444' : '#333'} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={true}
      >
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setSelectedImage(Math.floor(e.nativeEvent.contentOffset.x / width))}>
          {(product.images?.length ? product.images : [{ src: 'https://via.placeholder.com/400' }]).map((img, idx) => (
            <Image key={idx} source={{ uri: img.src }} style={{ width: width, height: 400, resizeMode: 'cover' }} />
          ))}
        </ScrollView>
        
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 15, gap: 8 }}>
          {product.images?.map((_, idx) => (
            <View key={idx} style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' }, selectedImage === idx && { backgroundColor: '#6200ee', width: 20 }]} />
          ))}
        </View>

        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>{product.name}</Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 15 }}>
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#4CAF50', marginRight: 12 }}>₹{product.price}</Text>
            {product.regular_price && product.regular_price !== product.price && (
              <Text style={{ fontSize: 18, color: '#999', textDecorationLine: 'line-through' }}>₹{product.regular_price}</Text>
            )}
          </View>

          <View style={{ marginBottom: 20 }}>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', backgroundColor: product.stock_status === 'instock' ? '#E8F5E9' : '#FFEBEE' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#4CAF50' }}>{product.stock_status === 'instock' ? '✓ In Stock' : '✗ Out of Stock'}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>Quantity:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
              <TouchableOpacity onPress={() => updateQuantity(-1)} style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderRadius: 8 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>-</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(1)} style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderRadius: 8 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333' }}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 25 }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#6200ee', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: 12, gap: 10 }} onPress={handleAddToCart}>
              <Ionicons name="cart-outline" size={24} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Add to Cart</Text>
            </TouchableOpacity>
            
          </View>

          <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 20 }} />

          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>📝 Description</Text>
          <Text style={{ fontSize: 15, color: '#666', lineHeight: 24, marginBottom: 20 }}>
            {product.description?.replace(/<[^>]*>/g, '') || 'No description available'}
          </Text>

          {product.categories?.length > 0 && (
            <>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>📂 Categories</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {product.categories.map(cat => (
                  <View key={cat.id} style={{ backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 }}>
                    <Text style={{ fontSize: 13, color: '#666' }}>{cat.name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
// ========== CART SCREEN ==========
const CartScreen = ({ navigation }) => {
  const { cart, removeFromCart, updateQuantity, getSubtotal, getTotal, getItemCount } = useContext(CartContext);

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Looks like you haven't added anything yet</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.emptyButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cartContainer}>
      <FlatList
        data={cart}
        showsVerticalScrollIndicator={true}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image source={{ uri: item.images?.[0]?.src }} style={styles.cartImage} />
            <View style={styles.cartDetails}>
              <Text style={styles.cartName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.cartPrice}>₹{item.price}</Text>
              <View style={styles.cartActions}>
                <View style={styles.cartQuantity}>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, (item.quantity || 1) - 1)} style={styles.cartQtyBtn}><Text>-</Text></TouchableOpacity>
                  <Text style={styles.cartQtyValue}>{item.quantity || 1}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, (item.quantity || 1) + 1)} style={styles.cartQtyBtn}><Text>+</Text></TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                  <Ionicons name="trash-outline" size={24} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.cartList}
      />
      
      <View style={styles.cartFooter}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal ({getItemCount()} items)</Text>
          <Text style={styles.totalValue}>₹{getSubtotal().toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Shipping</Text>
          <Text style={styles.totalValue}>₹50.00</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>₹{getTotal().toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={() => navigation.navigate('Checkout')}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ========== WISHLIST SCREEN ==========
const WishlistScreen = ({ navigation }) => {
  const { wishlist, removeFromWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);

  if (wishlist.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
        <Text style={styles.emptyText}>Save your favorite items here</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.emptyButtonText}>Explore Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={wishlist}
      showsVerticalScrollIndicator={true}
      renderItem={({ item }) => (
        <View style={styles.wishlistItem}>
          <Image source={{ uri: item.images?.[0]?.src }} style={styles.wishlistImage} />
          <View style={styles.wishlistDetails}>
            <Text style={styles.wishlistName}>{item.name}</Text>
            <Text style={styles.wishlistPrice}>₹{item.price}</Text>
            <View style={styles.wishlistActions}>
              <TouchableOpacity style={styles.wishlistAddButton} onPress={() => { addToCart(item); removeFromWishlist(item.id); Alert.alert('Added to cart'); }}>
                <Text style={styles.wishlistAddText}>Add to Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeFromWishlist(item.id)}>
                <Ionicons name="trash-outline" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={styles.wishlistList}
    />
  );
};

// ========== CHECKOUT SCREEN (ULTRA COMPACT) ==========
const CheckoutScreen = ({ navigation }) => {
  const { getTotal, clearCart, cart } = useContext(CartContext);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', city: '', pincode: '', paymentMethod: 'COD'
  });
  const [loading, setLoading] = useState(false);

  // Calculate totals correctly with parsed prices
  const subtotal = cart.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = item.quantity || 1;
    return sum + (price * qty);
  }, 0);
  const shipping = 50;
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        payment_method: formData.paymentMethod === 'COD' ? 'cod' : 'bacs',
        payment_method_title: formData.paymentMethod,
        set_paid: formData.paymentMethod !== 'COD',
        billing: {
          first_name: formData.name.split(' ')[0] || '',
          last_name: formData.name.split(' ').slice(1).join(' ') || '',
          address_1: formData.address,
          city: formData.city || 'Unknown',
          postcode: formData.pincode || '',
          country: 'IN',
          email: formData.email,
          phone: formData.phone
        },
        shipping: {
          first_name: formData.name.split(' ')[0] || '',
          last_name: formData.name.split(' ').slice(1).join(' ') || '',
          address_1: formData.address,
          city: formData.city || 'Unknown',
          postcode: formData.pincode || '',
          country: 'IN'
        },
        line_items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity || 1
        })),
        shipping_lines: [{
          method_id: 'flat_rate',
          method_title: 'Flat Rate',
          total: '50.00'
        }]
      };

      const url = `${API_URL}/orders?consumer_key=${CONSUMER_KEY}&consumer_secret=${CONSUMER_SECRET}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (response.ok && result.id) {
        Alert.alert(
          '✅ Order Placed!',
          `Order #${result.id}\nTotal: ₹${total.toFixed(2)}`,
          [{ text: 'OK', onPress: () => { clearCart(); navigation.navigate('Home'); } }]
        );
      } else {
        Alert.alert('Order Failed', result.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FOR MOBILE - ULTRA COMPACT
  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8f8f8' }}>
        {/* Header - Compact */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 12, 
          paddingTop: Platform.OS === 'ios' ? 50 : 12, 
          paddingBottom: 12, 
          backgroundColor: '#fff', 
          borderBottomWidth: 1, 
          borderBottomColor: '#f0f0f0'
        }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 35, height: 35, borderRadius: 18, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center' }}>Checkout</Text>
          <View style={{ width: 35 }} />
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={{ padding: 10, paddingBottom: 20 }}>
            
            {/* Order Summary - Ultra Compact */}
            <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>🛍️ Order ({cart.length})</Text>
              
              {cart.map((item, idx) => {
                const price = parseFloat(item.price) || 0;
                const qty = item.quantity || 1;
                return (
                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontSize: 12 }} numberOfLines={1}>{item.name} x{qty}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '500' }}>₹{(price * qty).toFixed(2)}</Text>
                  </View>
                );
              })}
              
              <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 }} />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold' }}>Total</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#4CAF50' }}>₹{total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Shipping Form - Compact with Rows */}
            <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>📋 Shipping</Text>
              
              {/* Row 1: Name + Email */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 10 }}>
                  <Ionicons name="person-outline" size={16} color="#999" />
                  <TextInput 
                    style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 13 }}
                    placeholder="Name *" 
                    value={formData.name} 
                    onChangeText={t => setFormData({...formData, name: t})} 
                  />
                </View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 10 }}>
                  <Ionicons name="mail-outline" size={16} color="#999" />
                  <TextInput 
                    style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 13 }}
                    placeholder="Email *" 
                    value={formData.email} 
                    onChangeText={t => setFormData({...formData, email: t})} 
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Row 2: Phone + Address */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 10 }}>
                  <Ionicons name="call-outline" size={16} color="#999" />
                  <TextInput 
                    style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 13 }}
                    placeholder="Phone *" 
                    value={formData.phone} 
                    onChangeText={t => setFormData({...formData, phone: t})} 
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 10 }}>
                  <Ionicons name="location-outline" size={16} color="#999" />
                  <TextInput 
                    style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 13 }}
                    placeholder="Address *" 
                    value={formData.address} 
                    onChangeText={t => setFormData({...formData, address: t})} 
                  />
                </View>
              </View>

              {/* Row 3: City + Pincode */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 10 }}>
                  <Ionicons name="business-outline" size={16} color="#999" />
                  <TextInput 
                    style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 13 }}
                    placeholder="City" 
                    value={formData.city} 
                    onChangeText={t => setFormData({...formData, city: t})} 
                  />
                </View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 10 }}>
                  <Ionicons name="mail-outline" size={16} color="#999" />
                  <TextInput 
                    style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, fontSize: 13 }}
                    placeholder="Pincode" 
                    value={formData.pincode} 
                    onChangeText={t => setFormData({...formData, pincode: t})} 
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Payment Method - Compact Row */}
            <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 10, marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 6 }}>💳 Payment</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {['COD', 'Credit Card', 'UPI'].map(method => (
                  <TouchableOpacity 
                    key={method} 
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} 
                    onPress={() => setFormData({...formData, paymentMethod: method})}
                  >
                    <Ionicons 
                      name={formData.paymentMethod === method ? 'radio-button-on' : 'radio-button-off'} 
                      size={18} 
                      color="#6200ee" 
                    />
                    <Text style={{ fontSize: 13, color: '#333' }}>{method}</Text>
                    {method === 'COD' && (
                      <View style={{ backgroundColor: '#4CAF50', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold' }}>Save</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Place Order Button - Compact */}
            <TouchableOpacity 
              style={{ 
                backgroundColor: loading ? '#ccc' : '#4CAF50', 
                paddingVertical: 12, 
                borderRadius: 10, 
                alignItems: 'center', 
                marginTop: 5
              }} 
              onPress={handlePlaceOrder} 
              disabled={loading}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>
                {loading ? 'Placing...' : `Place Order • ₹${total.toFixed(2)}`}
              </Text>
            </TouchableOpacity>
            
          </View>
        </ScrollView>

        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingOverlayText}>Processing...</Text>
          </View>
        )}
      </View>
    );
  }

  // FOR WEB - Keep your existing web code (unchanged)
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f8f8', overflowY: 'auto' }}>
  {/* Header - Ultra Compact */}
  <div style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', backgroundColor: 'white', display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
    <button onClick={() => navigation.goBack()} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>←</button>
    <div style={{ fontSize: '16px', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>Checkout</div>
    <div style={{ width: 30 }}></div>
  </div>
  
  <div style={{ padding: '10px', maxWidth: 500, margin: '0 auto' }}>
    {/* Order Summary - Compact */}
    <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: 10, marginBottom: 8 }}>
      <h3 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Order Summary ({cart.length})</h3>
      {cart.map((item, idx) => {
        const price = parseFloat(item.price) || 0;
        const qty = item.quantity || 1;
        return (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, borderBottom: '1px solid #f0f0f0', paddingBottom: 5 }}>
            <div>
              <strong style={{ fontSize: '12px' }}>{item.name}</strong>
              <div style={{ fontSize: '10px', color: '#666' }}>₹{price.toFixed(2)} × {qty}</div>
            </div>
            <div style={{ fontSize: '12px', fontWeight: '500' }}>₹{(price * qty).toFixed(2)}</div>
          </div>
        );
      })}
      <hr style={{ margin: '6px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '12px' }}>Subtotal</span>
        <span style={{ fontSize: '12px' }}>₹{subtotal.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '12px' }}>Shipping</span>
        <span style={{ fontSize: '12px' }}>₹{shipping.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid #e0e0e0' }}>
        <strong style={{ fontSize: '13px' }}>Total</strong>
        <strong style={{ fontSize: '14px', color: '#4CAF50' }}>₹{total.toFixed(2)}</strong>
      </div>
    </div>

    {/* Shipping Information - Compact with Rows */}
    <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: 10, marginBottom: 8 }}>
      <h3 style={{ fontSize: '14px', margin: '0 0 8px 0' }}>Shipping</h3>
      
      {/* Row 1: Name + Email */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input type="text" placeholder="Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: 8, border: '1px solid #e0e0e0' }} />
        <input type="email" placeholder="Email *" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: 8, border: '1px solid #e0e0e0' }} />
      </div>
      
      {/* Row 2: Phone + Address */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input type="tel" placeholder="Phone *" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: 8, border: '1px solid #e0e0e0' }} />
        <input type="text" placeholder="Address *" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: 8, border: '1px solid #e0e0e0' }} />
      </div>
      
      {/* Row 3: City + Pincode */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: 8, border: '1px solid #e0e0e0' }} />
        <input type="text" placeholder="Pincode" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} style={{ flex: 1, padding: '8px', fontSize: '12px', borderRadius: 8, border: '1px solid #e0e0e0' }} />
      </div>
    </div>

    {/* Payment Method - Compact Row */}
    <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: 10, marginBottom: 8 }}>
      <h3 style={{ fontSize: '14px', margin: '0 0 6px 0' }}>Payment</h3>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {['COD', 'Credit Card', 'UPI'].map(method => (
          <label key={method} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px' }}>
            <input type="radio" checked={formData.paymentMethod === method} onChange={() => setFormData({...formData, paymentMethod: method})} />
            <span>{method}</span>
            {method === 'COD' && <span style={{ backgroundColor: '#4CAF50', color: 'white', padding: '2px 6px', borderRadius: 8, fontSize: '9px' }}>Save</span>}
          </label>
        ))}
      </div>
    </div>

    {/* Place Order Button - Compact */}
    <button onClick={handlePlaceOrder} disabled={loading} style={{ width: '100%', backgroundColor: loading ? '#ccc' : '#4CAF50', color: 'white', padding: '10px', borderRadius: 10, border: 'none', fontSize: '14px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 10 }}>
      {loading ? 'Placing...' : `Place Order • ₹${total.toFixed(2)}`}
    </button>
  </div>
</div>
  );
};	
// ========== PROFILE SCREEN ==========
const ProfileScreen = () => {
  const { getTotal } = useContext(CartContext);
  
  const menuItems = [
    { icon: 'person-outline', title: 'My Orders', color: '#6200ee' },
    { icon: 'location-outline', title: 'Address Book', color: '#6200ee' },
    { icon: 'card-outline', title: 'Payment Methods', color: '#6200ee' },
    { icon: 'notifications-outline', title: 'Notifications', color: '#6200ee' },
    { icon: 'help-circle-outline', title: 'Help & Support', color: '#6200ee' },
    { icon: 'log-out-outline', title: 'Logout', color: '#ff4444' },
  ];

  return (
    <ScrollView style={styles.profileContainer} showsVerticalScrollIndicator={true}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }} style={styles.avatar} />
        <Text style={styles.profileName}>John Doe</Text>
        <Text style={styles.profileEmail}>john.doe@example.com</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}><Text style={styles.statNumber}>12</Text><Text style={styles.statLabel}>Orders</Text></View>
        <View style={styles.statCard}><Text style={styles.statNumber}>₹{getTotal()}</Text><Text style={styles.statLabel}>Spent</Text></View>
        <View style={styles.statCard}><Text style={styles.statNumber}>8</Text><Text style={styles.statLabel}>Reviews</Text></View>
      </View>

      {menuItems.map((item, idx) => (
        <TouchableOpacity key={idx} style={styles.menuItem}>
          <Ionicons name={item.icon} size={24} color={item.color} />
          <Text style={[styles.menuText, item.title === 'Logout' && { color: '#ff4444' }]}>{item.title}</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ========== CART PROVIDER ==========
// ========== CART PROVIDER (FIXED) ==========
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { 
                ...item, 
                quantity: (item.quantity || 1) + (product.quantity || 1),
                price: parseFloat(product.price) // Ensure price is number
              } 
            : item
        );
      }
      return [...prev, { 
        ...product, 
        quantity: product.quantity || 1,
        price: parseFloat(product.price) // Ensure price is number
      }];
    });
  };
  
  const removeFromCart = (id) => setCart(prev => prev.filter(item => item.id !== id));
  
  const updateQuantity = (id, quantity) => {
    setCart(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(1, quantity) } 
        : item
    ));
  };
  
  const getSubtotal = () => {
    return cart.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = item.quantity || 1;
      return sum + (price * qty);
    }, 0);
  };
  
  const getTotal = () => getSubtotal() + 50;
  
  const getItemCount = () => cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  const clearCart = () => setCart([]);
  
  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      getSubtotal, 
      getTotal, 
      getItemCount, 
      clearCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};

// ========== WISHLIST PROVIDER ==========
// ========== WISHLIST PROVIDER (NO ASYNCSTORAGE) ==========
const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  
  const addToWishlist = (product) => {
    if (!wishlist.find(p => p.id === product.id)) {
      setWishlist([...wishlist, product]);
    }
  };
  
  const removeFromWishlist = (id) => {
    setWishlist(wishlist.filter(p => p.id !== id));
  };
  
  const isInWishlist = (id) => wishlist.some(p => p.id === id);
  
  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

// ========== BOTTOM TABS ==========
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#6200ee',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: { paddingBottom: 5, height: 60, backgroundColor: '#fff' },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} /> }} />
    <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="cart-outline" size={24} color={color} /> }} />
    <Tab.Screen name="Wishlist" component={WishlistScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="heart-outline" size={24} color={color} /> }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} /> }} />
  </Tab.Navigator>
);

// ========== MAIN APP ==========
const Stack = createStackNavigator();

export default function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#6200ee' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: 'bold' } }}>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </WishlistProvider>
    </CartProvider>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: { 
  flex: 1, 
  backgroundColor: '#f8f8f8',
  height: Platform.OS === 'web' ? '100vh' : '100%'  // Add this line
},
  
  // Header
  header: { backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 10 : 15, paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  greeting: { fontSize: 14, color: '#666' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 2 },
  headerIcons: { flexDirection: 'row', gap: 15 },
  headerIcon: { position: 'relative', padding: 5 },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#ff4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  
  // Search
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  
  // Categories
  categoriesScroll: { maxHeight: 90, marginTop: 15 },
  categoriesContainer: { paddingHorizontal: 15, gap: 15 },
  categoryItem: { alignItems: 'center', width: 70 },
  categoryIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  categoryIconSelected: { backgroundColor: '#6200ee' },
  categoryName: { fontSize: 12, color: '#666' },
  categoryNameSelected: { color: '#6200ee', fontWeight: '600' },
  
  // Banner
  bannerContainer: { marginHorizontal: 15, marginTop: 15, borderRadius: 15, overflow: 'hidden', height: 140, position: 'relative' },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  bannerOverlay: { position: 'absolute', left: 20, top: 20 },
  bannerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  bannerSubtitle: { fontSize: 14, color: '#fff', marginTop: 5 },
  bannerButton: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginTop: 10, alignSelf: 'flex-start' },
  bannerButtonText: { color: '#6200ee', fontWeight: 'bold', fontSize: 12 },
  
  // Section Header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  viewAll: { color: '#6200ee', fontSize: 14 },
  
  // Products Grid
  productsGrid: { paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: 10 },
  productCard: { 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    marginBottom: 15, 
    overflow: 'hidden', 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImageContainer: { position: 'relative' },
  productImage: { width: '100%', height: 180, resizeMode: 'cover' },
  saleTag: { position: 'absolute', top: 10, left: 10, backgroundColor: '#ff4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5 },
  saleTagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  wishlistButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 6 },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5, lineHeight: 18 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  productPrice: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginRight: 8 },
  originalPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: '#666' },
  addButton: { backgroundColor: '#6200ee', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, gap: 4 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  
  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6200ee' },
  
  // Empty States
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 20 },
  emptyButton: { backgroundColor: '#6200ee', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  // Product Detail
  detailContainer: { flex: 1, backgroundColor: '#fff' },
   // Update these existing styles
  detailImage: { width: width, height: 400, resizeMode: 'cover' },
  imageDots: { flexDirection: 'row', justifyContent: 'center', marginVertical: 15, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
  dotActive: { backgroundColor: '#6200ee', width: 20 },
  detailContent: { padding: 20 },
  detailName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  detailPriceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 15 },
  detailPrice: { fontSize: 32, fontWeight: 'bold', color: '#4CAF50', marginRight: 12 },
  detailOldPrice: { fontSize: 18, color: '#999', textDecorationLine: 'line-through' },
  detailStock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  stockBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  inStock: { backgroundColor: '#E8F5E9' },
  outStock: { backgroundColor: '#FFEBEE' },
  stockText: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  quantitySection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  quantityLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  qtyButton: { width: 40, height: 40, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  qtyButtonText: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  qtyValue: { fontSize: 18, fontWeight: 'bold' },
  detailActions: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  addToCartButton: { flex: 1, backgroundColor: '#6200ee', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: 12, gap: 10 },
  buyNowButton: { flex: 1, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  description: { fontSize: 15, color: '#666', lineHeight: 24, marginBottom: 20 },
  categoriesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  categoryTag: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  categoryTagText: { fontSize: 13, color: '#666' },
  
  // Cart
  cartContainer: { flex: 1, backgroundColor: '#f8f8f8' },
  cartList: { padding: 15 },
  cartItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, marginBottom: 12, padding: 12, elevation: 2 },
  cartImage: { width: 90, height: 90, borderRadius: 10, resizeMode: 'cover' },
  cartDetails: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  cartName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 5 },
  cartPrice: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginBottom: 8 },
  cartActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartQuantity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartQtyBtn: { width: 32, height: 32, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  cartQtyValue: { fontSize: 16, fontWeight: 'bold' },
  cartFooter: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  grandTotal: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  grandTotalLabel: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  grandTotalValue: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50' },
  checkoutButton: { backgroundColor: '#4CAF50', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  checkoutButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  // Wishlist
  wishlistList: { padding: 15 },
  wishlistItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 15, marginBottom: 12, padding: 12, elevation: 2 },
  wishlistImage: { width: 90, height: 90, borderRadius: 10, resizeMode: 'cover' },
  wishlistDetails: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  wishlistName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 5 },
  wishlistPrice: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginBottom: 8 },
  wishlistActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wishlistAddButton: { backgroundColor: '#6200ee', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  wishlistAddText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  // Profile
  profileContainer: { flex: 1, backgroundColor: '#f8f8f8' },
  profileHeader: { backgroundColor: '#6200ee', paddingVertical: 40, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#fff', marginBottom: 15 },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 5 },
  profileEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, marginTop: -30, marginBottom: 20 },
  statCard: { backgroundColor: '#fff', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 15, elevation: 4, alignItems: 'center', minWidth: 100 },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#6200ee' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 5 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 15, marginBottom: 1, gap: 15 },
  menuText: { flex: 1, fontSize: 16, color: '#333' },
  
  // Checkout
  checkoutContainer: { flex: 1, backgroundColor: '#f8f8f8' },
  checkoutSection: { backgroundColor: '#fff', margin: 15, marginBottom: 0, padding: 20, borderRadius: 15, elevation: 2 },
  checkoutTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  checkoutInput: { backgroundColor: '#f5f5f5', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 12, fontSize: 15 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  paymentOptionText: { fontSize: 16, color: '#333' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  summaryLabel: { fontSize: 16, color: '#666' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  placeOrderButton: { backgroundColor: '#4CAF50', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  placeOrderText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
// Add these to your existing styles object

  // Product Detail New Styles
  detailHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailWishlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  detailScrollContent: {
    paddingBottom: 40,
  },
  imageGallery: {
    height: 400,
  },
  detailRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailRatingText: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },

  // Checkout New Styles
  checkoutHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkoutBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutScrollContent: {
    paddingTop: 100,
    paddingBottom: 40,
  },
  orderSummaryCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderItemName: {
    fontSize: 14,
    color: '#666',
    flex: 2,
  },
  orderItemQty: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 10,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  moreItems: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 15,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 12,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
  },
  codBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  deliveryTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deliveryDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  footerSpacer: {
    height: 20,
  },
loadingOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
},
loadingOverlayText: {
  color: '#fff',
  fontSize: 16,
  marginTop: 15,
},
});