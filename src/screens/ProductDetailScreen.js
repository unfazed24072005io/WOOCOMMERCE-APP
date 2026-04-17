import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Linking,
  TouchableOpacity,
} from 'react-native';
import {
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  Chip,
  Divider,
  Card,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { getProduct } from '../services/woocommerce';

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      const data = await getProduct(productId);
      setProduct(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {product.images?.map((image, index) => (
          <Image key={index} source={{ uri: image.src }} style={styles.image} />
        ))}
        {(!product.images || product.images.length === 0) && (
          <View style={styles.placeholderImage}>
            <Ionicons name="image" size={100} color="#ccc" />
          </View>
        )}
      </ScrollView>

      <View style={styles.content}>
        <View style={styles.header}>
          <Title style={styles.title}>{product.name}</Title>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
            style={styles.editIcon}
          >
            <Ionicons name="pencil" size={24} color="#6200ee" />
          </TouchableOpacity>
        </View>

        <View style={styles.priceContainer}>
          <Title style={styles.price}>₹{product.price}</Title>
          {product.sale_price && (
            <Paragraph style={styles.regularPrice}>₹{product.regular_price}</Paragraph>
          )}
        </View>

        <View style={styles.statusContainer}>
          <Chip
            icon={product.stock_status === 'instock' ? 'check-circle' : 'close-circle'}
            style={product.stock_status === 'instock' ? styles.inStock : styles.outOfStock}
            textStyle={{ color: '#fff', fontWeight: 'bold' }}
          >
            {product.stock_status === 'instock' ? 'IN STOCK' : 'OUT OF STOCK'}
          </Chip>

          {product.categories?.map((cat) => (
            <Chip key={cat.id} style={styles.categoryChip} icon="folder">
              {cat.name}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />

        {product.short_description && (
          <>
            <Title style={styles.sectionTitle}>
              <Ionicons name="document-text" size={24} /> Short Description
            </Title>
            <Paragraph style={styles.description}>
              {product.short_description.replace(/<[^>]*>/g, '')}
            </Paragraph>
            <Divider style={styles.divider} />
          </>
        )}

        {product.description && (
          <>
            <Title style={styles.sectionTitle}>
              <Ionicons name="newspaper" size={24} /> Full Description
            </Title>
            <Paragraph style={styles.description}>
              {product.description.replace(/<[^>]*>/g, '')}
            </Paragraph>
            <Divider style={styles.divider} />
          </>
        )}

        {product.attributes?.length > 0 && (
          <>
            <Title style={styles.sectionTitle}>
              <Ionicons name="options" size={24} /> Attributes
            </Title>
            {product.attributes.map((attr) => (
              <Card key={attr.id} style={styles.attributeCard}>
                <Card.Content>
                  <Paragraph style={styles.attributeName}>{attr.name}:</Paragraph>
                  <Paragraph style={styles.attributeValue}>
                    {attr.options.join(', ')}
                  </Paragraph>
                </Card.Content>
              </Card>
            ))}
            <Divider style={styles.divider} />
          </>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('EditProduct', { productId: product.id })}
            style={styles.editButton}
            icon="pencil"
          >
            Edit Product
          </Button>
          <Button
            mode="outlined"
            onPress={() => Linking.openURL(product.permalink)}
            style={styles.viewButton}
            icon="open-in-new"
          >
            View on Website
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: 400,
    height: 400,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: 400,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  editIcon: {
    padding: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginRight: 12,
  },
  regularPrice: {
    textDecorationLine: 'line-through',
    color: '#999',
    fontSize: 18,
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  inStock: {
    backgroundColor: '#4CAF50',
    marginRight: 8,
    marginBottom: 8,
  },
  outOfStock: {
    backgroundColor: '#f44336',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#2196F3',
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  attributeCard: {
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    elevation: 1,
  },
  attributeName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#6200ee',
    marginBottom: 4,
  },
  attributeValue: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 40,
  },
  editButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#6200ee',
    borderRadius: 10,
  },
  viewButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: '#6200ee',
    borderWidth: 2,
    borderRadius: 10,
  },
});

export default ProductDetailScreen;