/** MusicCast Monitoring functions by yannbug yann@abc.fr **/

clog( 'wp-geojson-map js script loaded.' );

var device_ip;
var api_base_url = '/YamahaExtendedControl/v1/';
var repeat_timeout = 10000;
var show_log = true;
var last_status = 0;
var glob_play_time = 0;
var playing = false;
var scanning = 0;
var network_ip = '';
var device_list = {};

function clog(data){
	if(show_log){
		console.log(data);
	}
}
	
/**
 * jQuery functions
 *
 */
(function($) {
	$(document).ready(function() {
				
		/** Get the status of the device **/
		get_status = function() {
			
			if( $.now() - last_status < 5000 ) {
				return;
			}
			last_status = $.now();
			
			clog( 'Getting status...' );
			var url = 'http://' + device_ip + api_base_url + 'netusb/getPlayInfo';
			$.get( url, function( data ) {
				clog('Success!');
				clog(data);
				
				glob_play_time = data.play_time;
				var play_time = pad( Math.floor( glob_play_time / 60 ), 2 ) + ':' +
					pad( ( glob_play_time % 60 ), 2 );
				var total_time = pad( Math.floor( data.total_time / 60 ), 2 ) + ':' +
					pad( ( data.total_time % 60 ), 2 );
				var remaining_time = data.total_time - data.play_time;
				if( remaining_time < 10 ) {
					repeat_timeout = (remaining_time + 1) * 1000;
				}
				
				if( 'play' == data.playback ) {
					playing = true;
				} else {
					playing = false;
				}
				
				var html = '<div style="height:127px;overflow:hidden;">' +
				
					'<div style="overflow:hidden;background-color:#272e36;padding:13px 15px 13px 15px;margin: 0 50px;border-top:1px solid #111;border-left:1px solid #111;border-bottom:1px solid #b0b0b0;border-right:1px solid #b0b0b0;">' +
					'<ul style="list-style-type:none;padding:0;margin:0;">' +
				
					'<li style="float:left;padding:0 5px 0 0;"><span class="t">Track:</span> <strong>' + data.track + '</strong></li>' +
					'<li style="float:left;padding:0 0 0 5px;"><span class="t">[</span> <strong><span id="pt">' + play_time + '</span> / ' + total_time + '</strong> <strong>]</strong></li>' +
				
					'<li style="float:left;clear:left;padding:0 5px 0 0;"><span class="t">Album / Artist:</span> <strong>' + data.album + '</strong></li>' +
					'<li style="float:left;padding:0;"><span class="t">/</span> <strong>' + data.artist + '</strong></li>' +
					
					'<li style="float:left;clear:left;padding:0 5px 0 0;"><span class="t">Input:</span> <strong>' + data.input + '</strong></li>' +
					'<li style="float:left;padding:0 5px;"><span class="t">Type:</span> <strong>' + data.play_queue_type + '</strong></li>' +
					'<li style="float:left;padding:0 5px;"><span class="t">Status:</span> <strong>' + data.playback + '</strong></li>' +
					'<li style="float:left;padding:0 5px;"><span class="t">Repeat:</span> <strong>' + data.repeat + '</strong></li>' +
					'<li style="float:left;padding:0 0 0 5px;"><span class="t">Shuffle:</span> <strong>' + data.shuffle + '</strong></li>' +
					
					'</ul></div></div>' +
					'<div id="visual"><img src="http://' + device_ip + data.albumart_url + '" style="width:100% auto" /></div>';
				$('#content').html( html );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
			setTimeout( get_status, repeat_timeout );
		}
		
		/** Update play time seconds **/
		update_pt = function() {
			if( !playing ) {
				setTimeout( update_pt, 10 );
				return;
			}
			glob_play_time ++;
			var play_time = pad( Math.floor( glob_play_time / 60 ), 2 ) + ':' +
			pad( ( glob_play_time % 60 ), 2 );
			$('#pt').html( play_time );
			setTimeout( update_pt, 1000 );
		}
		update_pt();
		
		/**Scan the network for devices **/
		scan_network = function() {
			if( 0 == scanning || 254 < scanning ) {
				return;
			}
			var ip_to_scan = network_ip + '.' + scanning;
			clog( 'scanning IP: ' + ip_to_scan );
			
			var url = 'http://' + ip_to_scan + api_base_url + 'system/getNetworkStatus';
			$.get( url, function( data ) {
				clog('Found device at IP: ' + ip_to_scan );
				device_list[ip_to_scan] = data.network_name;
				
				clog( 'device_list now:' );
				clog( device_list );
				
				//localStorage.device_list = device_list;
				//localStorage.setItem("device_list", JSON.stringify(device_list));
				var storable = JSON.stringify( device_list );
				localStorage.device_list = storable;
				
				clog( 'localStorage.device_list now:' );
				clog( storable );
				clog( localStorage.device_list );
				
			}).fail( function() {
				clog( 'Failed scan for IP: ' + ip_to_scan  + ' /URL: ' + url );
			});
			
			scanning ++;
			if( 255 > scanning ) {
				setTimeout( scan_network, 1000 );
			}
		}
		
		/** Add leading zeroes **/
		pad = function(str, max) {
			str = str.toString();
			return str.length < max ? pad("0" + str, max) : str;
		}
		
		populate_list_selector = function() {
			if( !device_list ) {
				device_list = JSON.parse(localStorage.getItem("device_list"));
			}
			if( !device_list ) {
				return;
			}
			clog( 'populate with device list:' );
			clog( device_list );
			
			$('#device_list_sel').html('');
			$.each( device_list, function( ip_addr, device_name ){
				clog('adding option ' + device_name);
				var option = new Option( device_name, ip_addr );
				//$(option).html( device_name );
				$('#device_list_sel').append(option);
			});
		}
		
		clog( 'MusicCast jQ functions loaded!' );
		
		if( localStorage.device_ip ) {
			clog('localStorage.device_ip:');
			clog(localStorage.device_ip);
			device_ip = localStorage.device_ip;
		}
		if( localStorage.getItem("device_list") ) {
			if( stored_list = JSON.parse(localStorage.getItem("device_list")) ) {
				clog('localStorage.device_list:');
				clog(localStorage.device_list);
				clog(stored_list);
				device_list = stored_list;
			}
		}
		
		if( !device_ip ) {
			$('#get_ip').show();
			populate_list_selector();
		} else {
			$('#change_ip').show();
			get_status();
		}
		
		$('#device_list_sel').on('change', function(e){
			var optionSelected = $("option:selected", this);
			$('#device_ip').val($(e.target).val());
		});
		
		$('#ok_button').on('click', function(e){
			clog( 'clicked Ok!' );
			device_ip = $('#device_ip').val();
			clog( 'device_ip: ' + device_ip );
			get_status();
			localStorage.device_ip = device_ip;
			$('#get_ip').hide();
			$('#change_ip').show();
		});
		
		$('#switch_button').on('click', function(e){
			clog( 'clicked Switch device!' );
			$('#device_ip').val( device_ip );
			$('#get_ip').show();
			populate_list_selector();
			$('#change_ip').hide();
		});
		
		$('#info_button').on('click', function(e){
			clog( 'clicked Info!' );
			var url = 'http://' + device_ip + api_base_url + 'system/getDeviceInfo';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				var html = JSON.stringify( data );
				$('#visual').html( html );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#features_button').on('click', function(e){
			clog( 'clicked Features!' );
			var url = 'http://' + device_ip + api_base_url + 'system/getFeatures';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				var html = JSON.stringify( data );
				$('#visual').html( html );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#network_button').on('click', function(e){
			clog( 'clicked Network!' );
			var url = 'http://' + device_ip + api_base_url + 'system/getNetworkStatus';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				var html = JSON.stringify( data );
				$('#visual').html( html );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#scan_button').on('click', function(e){
			clog( 'clicked Scan!' );
			
			if( !device_ip ) {
				$('#get_ip').show();
				populate_list_selector();
				$('#change_ip').hide();
				return;
			}
			
			var ip_bytes = device_ip.split('.');
			network_ip = ip_bytes[0]+'.'+ip_bytes[1]+'.'+ip_bytes[2];
			clog( 'net IP: ' + network_ip );
			
			scanning = 1;
			scan_network();
		});
		
		$('#mute_button').on('click', function(e){
			clog( 'Muting...' );
			var url = 'http://' + device_ip + api_base_url + 'main/setMute?enable=true';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#unmute_button').on('click', function(e){
			clog( 'Un-muting...' );
			var url = 'http://' + device_ip + api_base_url + 'main/setMute?enable=false';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#volume_dec').on('click', function(e){
			clog( 'Decreasing volume...' );
			var url = 'http://' + device_ip + api_base_url + 'main/setVolume?volume=down';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#volume_inc').on('click', function(e){
			clog( 'Increasing volume...' );
			var url = 'http://' + device_ip + api_base_url + 'main/setVolume?volume=up';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#prev_button').on('click', function(e){
			clog( 'Jumping to previous track...' );
			var url = 'http://' + device_ip + api_base_url + 'netusb/setPlayback?playback=previous';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				setTimeout( get_status, 1000 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#next_button').on('click', function(e){
			clog( 'Jumping to next track...' );
			var url = 'http://' + device_ip + api_base_url + 'netusb/setPlayback?playback=next';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				setTimeout( get_status, 1000 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#stop_button').on('click', function(e){
			clog( 'Stop...' );
			var url = 'http://' + device_ip + api_base_url + 'netusb/setPlayback?playback=stop';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				playing = false;
				setTimeout( get_status, 1000 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#play_button').on('click', function(e){
			clog( 'Play...' );
			var url = 'http://' + device_ip + api_base_url + 'netusb/setPlayback?playback=play';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				playing = true;
				setTimeout( get_status, 1000 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
		
		$('#power_button').on('click', function(e){
			clog( 'Power toggle...' );
			var url = 'http://' + device_ip + api_base_url + 'main/setPower?power=toggle';
			$.get( url, function( data ) {
				clog('Success!');
				get_status();
				setTimeout( get_status, 1000 );
			}).fail( function() {
				clog( 'Failed for URL: ' + url );
			});
		});
	});
})( jQuery );